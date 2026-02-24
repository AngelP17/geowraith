import React from 'react';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';

export const ContactHeader: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto text-center mb-16">
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 
                   text-white/50 text-xs font-medium tracking-wider uppercase mb-4"
      >
        <Mail className="w-3.5 h-3.5" />
        Contact
      </motion.span>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-5xl font-semibold text-white mb-6"
      >
        Get in{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
          Touch
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-white/50 text-base md:text-lg"
      >
        Have questions about GeoWraith? Want to discuss enterprise support or partnerships? We'd love
        to hear from you.
      </motion.p>
    </div>
  );
};
