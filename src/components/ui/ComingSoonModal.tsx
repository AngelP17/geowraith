/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Bell, ArrowRight } from 'lucide-react';
import { MagneticButton } from './SectionReveal';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  title = 'Coming Soon',
  description = 'This feature is currently in development. Stay tuned for updates!',
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-50"
          >
            <div className="relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 border border-white/10 
                           flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>

              {/* Content */}
              <div className="relative text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 
                             flex items-center justify-center mx-auto mb-6"
                >
                  <Clock className="w-8 h-8 text-emerald-400" />
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-semibold text-white mb-3"
                >
                  {title}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/50 text-sm leading-relaxed mb-6"
                >
                  {description}
                </motion.p>

                {/* Feature status */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/[0.03] 
                             border border-white/[0.06] mb-6"
                >
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-white/60 text-xs">In Active Development</span>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3"
                >
                  <a
                    href="https://github.com/AngelP17/geowraith"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm
                               hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" />
                    Watch on GitHub
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  
                  <MagneticButton
                    strength={0.1}
                    onClick={onClose}
                    className="w-full py-3 text-white rounded-xl font-medium text-sm border border-white/10
                               hover:bg-white/5 transition-colors"
                  >
                    Got it
                  </MagneticButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Hook for managing modal state
export const useComingSoon = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [content, setContent] = React.useState({ title: 'Coming Soon', description: '' });

  const showComingSoon = (title?: string, description?: string) => {
    setContent({
      title: title || 'Coming Soon',
      description: description || 'This feature is currently in development. Stay tuned for updates!',
    });
    setIsOpen(true);
  };

  const closeComingSoon = () => setIsOpen(false);

  return {
    isOpen,
    content,
    showComingSoon,
    closeComingSoon,
    ComingSoonModal: () => (
      <ComingSoonModal
        isOpen={isOpen}
        onClose={closeComingSoon}
        title={content.title}
        description={content.description}
      />
    ),
  };
};
