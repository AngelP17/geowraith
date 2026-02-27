/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Menu } from 'lucide-react';
import { MobileMenu } from './ui/MobileMenu';
import { navLinks } from '../data/features';

interface NavbarProps {
  onOpenComingSoon?: (title: string, description: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenComingSoon }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    // Handle placeholder links
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Split nav links: 2 on left, 2 on right of logo
  const leftNavLinks = navLinks.slice(0, 2); // Docs, Examples
  const rightNavLinks = navLinks.slice(2);   // Gallery, Contact

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
                   ${isScrolled 
                     ? 'bg-[#060606]/85 backdrop-blur-xl border-b border-[rgba(255,255,255,0.12)]' 
                     : 'bg-transparent'}`}
      >
        <div className="flex items-center justify-center w-full px-6 py-4 md:py-5">
          <div
            className={`w-full max-w-5xl px-4 md:px-6 rounded-full transition-all
                        duration-300 ${isScrolled
                          ? 'bg-white/[0.03] border border-[rgba(255,255,255,0.12)]'
                          : 'border border-transparent'}`}
          >
            <div className="flex items-center justify-center md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
              <ul className="hidden md:flex items-center justify-self-end justify-end gap-6 lg:gap-8">
                {leftNavLinks.map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  >
                    <motion.a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href, item.label)}
                      whileHover={{ y: -1 }}
                      className="group flex items-center gap-1 text-white/62 text-[13px] font-medium
                                 tracking-[0.04em] hover:text-white transition-colors duration-200
                                 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && (
                        <ChevronDown
                          size={12}
                          className="text-white/30 group-hover:text-white/50 transition-colors"
                        />
                      )}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>

              <motion.a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTop();
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-4 py-2"
              >
                <img
                  src="/logo-wordmark.png"
                  alt="GeoWraith"
                  className="h-8 w-auto select-none"
                />
              </motion.a>

              <ul className="hidden md:flex items-center justify-self-start justify-start gap-6 lg:gap-8">
                {rightNavLinks.map((item, i) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  >
                    <motion.a
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item.href, item.label)}
                      whileHover={{ y: -1 }}
                      className="group flex items-center gap-1 text-white/62 text-[13px] font-medium
                                 tracking-[0.04em] hover:text-white transition-colors duration-200
                                 cursor-pointer"
                    >
                      {item.label}
                      {item.hasDropdown && (
                        <ChevronDown
                          size={12}
                          className="text-white/30 group-hover:text-white/50 transition-colors"
                        />
                      )}
                    </motion.a>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          {/* MOBILE: Hamburger Menu */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden absolute right-6 w-10 h-10 rounded-lg bg-white/5 border border-white/14
                       flex items-center justify-center hover:bg-white/10 hover:border-white/30
                       transition-all duration-200"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-white/70" />
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        onOpenComingSoon={onOpenComingSoon}
      />
    </>
  );
};
