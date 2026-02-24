import type { ContactFormData, ContactFormErrors } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactForm(formData: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(formData.email)) {
    errors.email = 'Please enter a valid email';
  }

  if (!formData.subject) {
    errors.subject = 'Please select a subject';
  }

  if (!formData.message.trim()) {
    errors.message = 'Message is required';
  } else if (formData.message.length < 10) {
    errors.message = 'Message must be at least 10 characters';
  }

  return errors;
}

export function getInputClasses(fieldName: string, focusedField: string | null, error?: string) {
  return `w-full px-4 py-3 rounded-xl bg-white/[0.02] border text-white text-sm
    placeholder:text-white/30 transition-all duration-200 outline-none
    ${
      error
        ? 'border-red-500/50 focus:border-red-500'
        : focusedField === fieldName
          ? 'border-white/20 bg-white/[0.04]'
          : 'border-white/[0.06] hover:border-white/[0.10]'
    }`;
}
