/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Github, Send, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { MagneticButton } from '../ui/SectionReveal';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactProps {
  onOpenComingSoon?: (title: string, description: string) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@geowraith.dev',
    href: 'mailto:hello@geowraith.dev',
    description: 'For general inquiries and support',
    external: false,
  },
  {
    icon: Github,
    label: 'GitHub',
    value: 'github.com/AngelP17/geowraith',
    href: 'https://github.com/AngelP17/geowraith',
    description: 'Issues, contributions, and code',
    external: true,
  },
];

const subjectOptions = [
  'General Inquiry',
  'Enterprise Support',
  'Bug Report',
  'Feature Request',
  'Partnership',
  'Other',
];

export const Contact: React.FC<ContactProps> = ({ onOpenComingSoon }) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setStatus('submitting');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For demo purposes, always succeed
    setStatus('success');
    setFormData({ name: '', email: '', subject: '', message: '' });

    // Reset after 5 seconds
    setTimeout(() => setStatus('idle'), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const getInputClasses = (fieldName: string, hasError?: string) => `
    w-full px-4 py-3 rounded-xl bg-white/[0.02] border text-white text-sm
    placeholder:text-white/30 transition-all duration-200 outline-none
    ${hasError 
      ? 'border-red-500/50 focus:border-red-500' 
      : focusedField === fieldName 
        ? 'border-white/20 bg-white/[0.04]' 
        : 'border-white/[0.06] hover:border-white/[0.10]'
    }
  `;

  return (
    <section id="contact" className="relative w-full py-24 md:py-32 bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black to-[#050505] pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full px-5 md:px-[120px]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
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
              Have questions about GeoWraith? Want to discuss enterprise support or partnerships? 
              We'd love to hear from you.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Contact Methods - Left Side */}
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

              {/* Response time note */}
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
                      We typically respond within 24 hours during business days.
                      For urgent issues, select "Enterprise Support" or "Bug Report."
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form - Right Side */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                {/* Success Overlay */}
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
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 
                                        flex items-center justify-center mx-auto mb-4">
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

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name Field */}
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-2">
                        Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Your name"
                        className={getInputClasses('name', errors.name)}
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

                    {/* Email Field */}
                    <div>
                      <label className="block text-white/60 text-sm font-medium mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="you@example.com"
                        className={getInputClasses('email', errors.email)}
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

                  {/* Subject Field */}
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('subject')}
                        onBlur={() => setFocusedField(null)}
                        className={`${getInputClasses('subject', errors.subject)} appearance-none cursor-pointer`}
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

                  {/* Message Field */}
                  <div>
                    <label className="block text-white/60 text-sm font-medium mb-2">
                      Message <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Tell us about your project, question, or how we can help..."
                      rows={5}
                      className={`${getInputClasses('message', errors.message)} resize-none`}
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
                        <span className="text-white/30 text-xs">
                          {formData.message.length} characters
                        </span>
                      )}
                      <span className="text-white/30 text-xs">Min. 10 characters</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <MagneticButton
                    strength={0.1}
                    className={`w-full py-4 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                               ${status === 'submitting'
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

                  {/* Privacy Note */}
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
          </div>
        </div>
      </div>
    </section>
  );
};
