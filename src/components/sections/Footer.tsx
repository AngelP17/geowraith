/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Github, ExternalLink } from 'lucide-react';
import { footerSections } from '../../data/features';

interface FooterProps {
  onOpenComingSoon?: (title: string, description: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenComingSoon }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Github, href: 'https://github.com/AngelP17/geowraith', label: 'GitHub', external: true },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    const placeholderMap: Record<string, { title: string; description: string }> = {
      '#api': {
        title: 'API Reference',
        description: 'Complete API documentation with endpoint specifications and code examples coming soon.',
      },
      '#blog': {
        title: 'Blog',
        description: 'Technical articles, case studies, and product updates coming soon.',
      },
      '#license': {
        title: 'MIT License',
        description: 'GeoWraith is released under the MIT License. Full license text will be available soon.',
      },
      '#terms': {
        title: 'Terms of Use',
        description: 'Terms of service and usage guidelines are being prepared.',
      },
      '#ethics': {
        title: 'Responsible Use',
        description: 'Guidelines for ethical use of GeoWraith technology. Documentation in progress.',
      },
    };

    const content = placeholderMap[href];
    if (content && onOpenComingSoon) {
      e.preventDefault();
      onOpenComingSoon(content.title, content.description);
    }
  };

  return (
    <footer className="relative w-full bg-[#050505] border-t border-white/[0.06]">
      {/* Top gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="w-full px-5 md:px-[120px] py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="col-span-2"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-bold text-xl tracking-wide">GEOWRAITH</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-medium">
                  v2.2
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
                100% local-first visual geolocation. Open-source alternative to GeoSpy. 
                MIT licensed. Zero cost, zero data leaves your machine.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target={social.external ? '_blank' : undefined}
                    rel={social.external ? 'noopener noreferrer' : undefined}
                    onClick={(e) => !social.external && handleLinkClick(e, social.href, social.label)}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center
                               hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Link Columns */}
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 1) * 0.1 }}
              >
                <h4 className="text-white/60 text-xs uppercase tracking-wider font-semibold mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link) => {
                    const isExternal = link.href.startsWith('http');
                    const isPlaceholder = link.href.startsWith('#') && ![
                      '#contact',
                      '#docs',
                      '#examples',
                      '#gallery',
                      '#features',
                      '#how-it-works',
                      '#tech-stack',
                      '#pricing',
                      '#privacy',
                    ].includes(link.href);
                    
                    return (
                      <li key={link.label}>
                        <motion.a
                          href={link.href}
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'noopener noreferrer' : undefined}
                          onClick={(e) => isPlaceholder && handleLinkClick(e, link.href, link.label)}
                          whileHover={{ x: 2 }}
                          className="group flex items-center gap-1 text-white/40 text-sm hover:text-white/70 
                                     transition-colors duration-200"
                        >
                          {link.label}
                          {isExternal && (
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </motion.a>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="pt-8 border-t border-white/[0.06]"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-white/30 text-xs text-center md:text-left">
                {currentYear} GeoWraith. Open source under MIT License.
              </p>

              {/* Legal Links */}
              <div className="flex items-center gap-6">
                <a 
                  href="#privacy" 
                  onClick={(e) => handleLinkClick(e, '#privacy', 'Privacy')}
                  className="text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  Privacy
                </a>
                <a 
                  href="#terms" 
                  onClick={(e) => handleLinkClick(e, '#terms', 'Terms')}
                  className="text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  Terms
                </a>
                <a 
                  href="#ethics" 
                  onClick={(e) => handleLinkClick(e, '#ethics', 'Ethics')}
                  className="text-white/30 text-xs hover:text-white/50 transition-colors"
                >
                  Responsible Use
                </a>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                />
                <span className="text-white/40 text-xs">All systems operational</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
