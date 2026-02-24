/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Github, BookOpen, Image, Mail, ExternalLink } from 'lucide-react';
import { navLinks } from '../../data/features';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenComingSoon?: (title: string, description: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Docs: <BookOpen className="w-4 h-4" />,
  Examples: <ExternalLink className="w-4 h-4" />,
  Gallery: <Image className="w-4 h-4" />,
  Contact: <Mail className="w-4 h-4" />,
};

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenComingSoon }) => {
  const openGitHub = () => {
    window.open('https://github.com/AngelP17/geowraith', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleNavClick = (href: string, label: string) => {
    // Handle placeholder links
    if (href.startsWith('#')) {
      onClose();
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#0A0A0A] border-l border-white/10 z-50 md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <span className="text-white font-bold text-lg">GEOWRAITH</span>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center
                           hover:bg-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-5">
              <ul className="space-y-1">
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                  >
                    <button
                      onClick={() => handleNavClick(link.href, link.label)}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-white/70 
                                 hover:text-white hover:bg-white/5 transition-all duration-200
                                 active:scale-[0.98] text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/50">{iconMap[link.label]}</span>
                        <span className="font-medium">{link.label}</span>
                      </div>
                      {link.hasDropdown && <ChevronDown className="w-4 h-4 text-white/30" />}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* CTA Section */}
            <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 bg-[#0A0A0A]">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openGitHub}
                className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm
                           hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                <Github className="w-4 h-4" />
                Get Repo Now
              </motion.button>
              <p className="text-center text-white/30 text-xs mt-3">
                v2.2 • MIT Licensed
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
