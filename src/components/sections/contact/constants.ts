import { Mail, Github } from 'lucide-react';
import type { ContactMethod } from './types';

export const contactMethods: ContactMethod[] = [
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

export const subjectOptions = [
  'General Inquiry',
  'Enterprise Support',
  'Bug Report',
  'Feature Request',
  'Partnership',
  'Other',
];
