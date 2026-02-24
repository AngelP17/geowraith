import type { ComponentType } from 'react';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactFormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export type ContactFormStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface ContactMethod {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
  description: string;
  external: boolean;
}
