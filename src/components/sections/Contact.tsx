/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ContactForm } from './contact/ContactForm';
import { ContactHeader } from './contact/ContactHeader';
import { ContactMethods } from './contact/ContactMethods';
import type { ContactFormData, ContactFormErrors, ContactFormStatus } from './contact/types';
import { validateContactForm } from './contact/validation';

interface ContactProps {
  onOpenComingSoon?: (title: string, description: string) => void;
}

const EMPTY_FORM: ContactFormData = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

export const Contact: React.FC<ContactProps> = () => {
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validateContactForm(formData);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus('submitting');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStatus('success');
    setFormData(EMPTY_FORM);
    setTimeout(() => setStatus('idle'), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <section id="contact" className="relative w-full py-24 md:py-32 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-black to-[#050505] pointer-events-none" />
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
          <ContactHeader />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <ContactMethods />
            <ContactForm
              formData={formData}
              errors={errors}
              status={status}
              focusedField={focusedField}
              onSubmit={handleSubmit}
              onChange={handleChange}
              onFocusField={setFocusedField}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
