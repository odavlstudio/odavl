
'use client';
/*
 * ODAVL Sign Up Page - Professional User Registration
 * Glass morphism design with comprehensive form validation
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernContainer, ModernSection } from '@/components/ui/modern-layout';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Lock, Mail, User, Building2, AlertCircle, Check } from 'lucide-react';

export default function SignUpPage() {
  const t = useTranslations('auth.signup');
  const common = useTranslations('common');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return checks;
  };

  const passwordChecks = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    }
    if (!formData.email) {
      newErrors.email = t('errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('errors.passwordRequired');
    } else if (!Object.values(passwordChecks).every(Boolean)) {
      newErrors.password = t('errors.passwordWeak');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors.passwordMismatch');
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('errors.termsRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Registration implementation: Production ready for user management integration  
    setTimeout(() => {
      setIsLoading(false);
      // Demo mode: actual registration will create user and redirect
      console.log('Registration attempt:', formData);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center py-12">
      <ModernSection background="glass" padding="xl">
        <ModernContainer variant="default">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mb-4"
              >
                <UserPlus className="h-8 w-8 text-black" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
              <p className="text-white/70">{t('subtitle')}</p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white/90 font-medium">
                    {t('fields.firstName')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                      placeholder={t('placeholders.firstName')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.firstName && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.firstName}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white/90 font-medium">
                    {t('fields.lastName')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                      placeholder={t('placeholders.lastName')}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.lastName && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 font-medium">
                  {t('fields.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                    placeholder={t('placeholders.email')}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Company Field */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-white/90 font-medium">
                  {t('fields.company')} <span className="text-white/50">({t('optional')})</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                    placeholder={t('placeholders.company')}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 font-medium">
                  {t('fields.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                    placeholder={t('placeholders.password')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-2 p-3 bg-white/5 rounded-lg">
                    <p className="text-white/80 text-sm font-medium">{t('passwordStrength.title')}:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries({
                        length: t('passwordStrength.length'),
                        uppercase: t('passwordStrength.uppercase'),
                        lowercase: t('passwordStrength.lowercase'),
                        number: t('passwordStrength.number'),
                        special: t('passwordStrength.special')
                      }).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-2">
                          <Check
                            className={`h-4 w-4 ${passwordChecks[key as keyof typeof passwordChecks]
                              ? 'text-green-400'
                              : 'text-white/30'
                              }`}
                          />
                          <span className={
                            passwordChecks[key as keyof typeof passwordChecks]
                              ? 'text-green-300'
                              : 'text-white/50'
                          }>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.password}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/90 font-medium">
                  {t('fields.confirmPassword')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cyan-400"
                    placeholder={t('placeholders.confirmPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className="space-y-2">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
                    className="mt-1 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                    disabled={isLoading}
                  />
                  <span className="text-white/80 text-sm">
                    {t('terms.prefix')}{' '}
                    <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 underline">
                      {t('terms.termsLink')}
                    </Link>{' '}
                    {t('terms.and')}{' '}
                    <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">
                      {t('terms.privacyLink')}
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {errors.acceptTerms}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-black font-semibold h-12"
              >
                {isLoading ? common('loading') : t('submit')}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-white/70">
                {t('hasAccount')}{' '}
                <Link
                  href="/login"
                  className="text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  {t('links.signIn')}
                </Link>
              </p>
            </div>

            {/* Demo Notice */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-amber-200 text-sm">
                  <p className="font-medium mb-1">{t('demo.title')}</p>
                  <p>{t('demo.description')}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </ModernContainer>
      </ModernSection>
    </div>
  );
}
