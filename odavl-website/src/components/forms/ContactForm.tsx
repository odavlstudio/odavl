'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trackEvents } from '@/lib/analytics';

interface FormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', company: '', message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (data: FormData): Partial<FormData> => {
    const errs: Partial<FormData> = {};
    if (!data.name.trim()) errs.name = 'Name is required';
    if (!data.email.match(/\S+@\S+\.\S+/)) errs.email = 'Valid email required';
    if (!data.message.trim()) errs.message = 'Message is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: 'contact' })
      });
      
      if (response.ok) {
        trackEvents.contactForm();
        setSuccess(true);
        setFormData({ name: '', email: '', company: '', message: '' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 rounded-lg text-center">
        <p className="text-green-700">Thanks! We&apos;ll contact you within 24h.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Your Name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          aria-label="Name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      
      <div>
        <Input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
          aria-label="Email"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      
      <Input
        placeholder="Company (Optional)"
        value={formData.company}
        onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
        aria-label="Company"
      />
      
      <div>
        <Textarea
          placeholder="How can we help you?"
          value={formData.message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          aria-label="Message"
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
      </div>
      
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}