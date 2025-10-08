// ODAVL-WAVE-X8-INJECT: Form Validation Tests - Contact & Pilot Forms
// @odavl-governance: TESTING-SAFE mode active

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
}

export class FormValidator {
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateContactForm(formData: { 
    name: string; 
    email: string; 
    message: string; 
  }): FormValidationResult {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!this.validateEmail(formData.email)) errors.push('Valid email is required');
    if (!formData.message.trim()) errors.push('Message is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validatePilotForm(formData: { 
    company: string; 
    email: string; 
    projectSize: string; 
  }): FormValidationResult {
    const errors: string[] = [];

    if (!formData.company.trim()) errors.push('Company name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!this.validateEmail(formData.email)) errors.push('Valid email is required');
    if (!formData.projectSize) errors.push('Project size selection is required');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}