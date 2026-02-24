import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { MagneticButton } from '../../ui/SectionReveal';
import { subjectOptions } from './constants';
import { getInputClasses } from './validation';
import type { ContactFormData, ContactFormErrors, ContactFormStatus } from './types';

interface ContactFormProps {
  formData: ContactFormData;
  errors: ContactFormErrors;
  status: ContactFormStatus;
  focusedField: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onFocusField: (field: string | null) => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  formData,
  errors,
  status,
  focusedField,
  onSubmit,
  onChange,
  onFocusField,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="lg:col-span-3"
    >
      <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h4 className="text-white font-semibold text-xl mb-2">Message Sent!</h4>
                <p className="text-white/50 text-sm max-w-xs mx-auto">
                  Thanks for reaching out. We'll get back to you as soon as possible.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={onChange}
                onFocus={() => onFocusField('name')}
                onBlur={() => onFocusField(null)}
                placeholder="Your name"
                className={getInputClasses('name', focusedField, errors.name)}
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-white/60 text-sm font-medium mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                onFocus={() => onFocusField('email')}
                onBlur={() => onFocusField(null)}
                placeholder="you@example.com"
                className={getInputClasses('email', focusedField, errors.email)}
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </motion.p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">
              Subject <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                name="subject"
                value={formData.subject}
                onChange={onChange}
                onFocus={() => onFocusField('subject')}
                onBlur={() => onFocusField(null)}
                className={`${getInputClasses('subject', focusedField, errors.subject)} appearance-none cursor-pointer`}
              >
                <option value="" disabled className="bg-[#0a0a0a] text-white/50">
                  Select a subject
                </option>
                {subjectOptions.map((option) => (
                  <option key={option} value={option} className="bg-[#0a0a0a] text-white">
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.subject && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs mt-1.5 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.subject}
              </motion.p>
            )}
          </div>

          <div>
            <label className="block text-white/60 text-sm font-medium mb-2">
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={onChange}
              onFocus={() => onFocusField('message')}
              onBlur={() => onFocusField(null)}
              placeholder="Tell us about your project, question, or how we can help..."
              rows={5}
              className={`${getInputClasses('message', focusedField, errors.message)} resize-none`}
            />
            <div className="flex items-center justify-between mt-1.5">
              {errors.message ? (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs flex items-center gap-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.message}
                </motion.p>
              ) : (
                <span className="text-white/30 text-xs">{formData.message.length} characters</span>
              )}
              <span className="text-white/30 text-xs">Min. 10 characters</span>
            </div>
          </div>

          <MagneticButton
            strength={0.1}
            className={`w-full py-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                       ${
                         status === 'submitting'
                           ? 'bg-white/50 text-black cursor-not-allowed'
                           : 'bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                       }`}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send Message
                <Send className="w-4 h-4" />
              </>
            )}
          </MagneticButton>

          <p className="text-white/30 text-xs text-center">
            Your message will be processed in accordance with our{' '}
            <a href="#privacy" className="text-white/50 hover:text-white/70 underline transition-colors">
              Privacy Policy
            </a>
            . We never share your information with third parties.
          </p>
        </form>
      </div>
    </motion.div>
  );
};
