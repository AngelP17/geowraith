/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { pricing } from '../../data/extendedContent';
import { Check, ArrowRight } from 'lucide-react';

export const Pricing: React.FC = () => {
  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openGitHub = () => {
    window.open('https://github.com/AngelP17/geowraith', '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="pricing" className="relative w-full py-24 md:py-32 bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black pointer-events-none" />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 
                         text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
            >
              Pricing
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-6"
            >
              {pricing.headline}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-base md:text-lg"
            >
              {pricing.description}
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {pricing.plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`relative p-8 rounded-2xl border ${
                  plan.popular
                    ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/20'
                    : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/80" />
                      Recommended
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-white font-semibold text-xl mb-2">{plan.name}</h3>
                  <p className="text-white/40 text-sm">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl md:text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm ml-2">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-white/60 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={plan.popular ? openGitHub : scrollToContact}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2
                             ${plan.popular
                               ? 'bg-white text-black hover:bg-white/90'
                               : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'}`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Cost Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="max-w-2xl mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
          >
            <p className="text-white/40 text-sm text-center mb-4">{pricing.costComparison.description}</p>
            <div className="space-y-3">
              {pricing.costComparison.items.map((item, index) => (
                <div
                  key={item.service}
                  className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0"
                >
                  <span className="text-white/60 text-sm">{item.service}</span>
                  <div className="text-right">
                    <span className={`font-medium ${item.monthlyCost === '$0' ? 'text-emerald-400' : 'text-white'}`}>
                      {item.monthlyCost}
                    </span>
                    <span className="text-white/30 text-xs ml-2">/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
