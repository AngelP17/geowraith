import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { contactMethods } from './constants';

export const ContactMethods: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-2 space-y-4"
    >
      <h3 className="text-white font-semibold text-lg mb-6">Other Ways to Reach Us</h3>

      {contactMethods.map((method, index) => (
        <motion.a
          key={method.label}
          href={method.href}
          target={method.href.startsWith('http') ? '_blank' : undefined}
          rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 + index * 0.1 }}
          whileHover={{ x: 4 }}
          className="group flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]
                     hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] 
                          flex items-center justify-center shrink-0
                          group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all">
            <method.icon className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{method.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/30 opacity-0 -translate-x-2 
                                     group-hover:opacity-100 group-hover:translate-x-0 
                                     transition-all duration-200" />
            </div>
            <p className="text-white/70 text-sm mt-0.5">{method.value}</p>
            <p className="text-white/40 text-xs mt-1">{method.description}</p>
          </div>
        </motion.a>
      ))}

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
        className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
      >
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white/70 text-sm font-medium">Fast Response Times</p>
            <p className="text-white/40 text-xs mt-1">
              We typically respond within 24 hours during business days. For urgent issues, select
              "Enterprise Support" or "Bug Report."
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
