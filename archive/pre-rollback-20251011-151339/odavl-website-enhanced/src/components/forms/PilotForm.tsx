'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trackEvents } from '@/lib/analytics';

interface PilotFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export function PilotForm() {
  const [formData, setFormData] = useState<PilotFormData>({
    name: '', email: '', company: '', message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<PilotFormData>>({});

  const validate = (data: PilotFormData): Partial<PilotFormData> => {
    const errs: Partial<PilotFormData> = {};
    if (!data.name.trim()) errs.name = 'Name is required';
    if (!data.email.match(/\S+@\S+\.\S+/)) errs.email = 'Valid email required';
    if (!data.company.trim()) errs.company = 'Company is required for pilot';
    if (!data.message.trim()) errs.message = 'Use case description required';
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
        body: JSON.stringify({ ...formData, type: 'pilot' })
      });
      
      if (response.ok) {
        trackEvents.pilotForm();
        setSuccess(true);
        setFormData({ name: '', email: '', company: '', message: '' });
      }
    } catch (error) {
      console.error('Pilot form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 rounded-lg text-center">
        <p className="text-green-700">Thanks! We&apos;ll contact you within 24h about the pilot program.</p>
      </div>
    );
  }

  return (
    <div id="pilot-form">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            placeholder="Your Name"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          aria-label="Email"
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      
      <div>
        <Input
          placeholder="Company Name"
          value={formData.company}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          aria-label="Company"
          className={errors.company ? 'border-red-500' : ''}
        />
        {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
      </div>
      
      <div>
        <Textarea
          placeholder="Describe your code quality automation use case"
          value={formData.message}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          aria-label="Use Case Description"
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
      </div>
      
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Submitting...' : 'Request Pilot Access'}
        </Button>
      </form>
    </div>
  );
}