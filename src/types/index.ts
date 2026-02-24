/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface TechStackItem {
  name: string;
  category: 'core' | 'storage' | 'frontend' | 'infrastructure';
  description: string;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  details: string[];
}

export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}
