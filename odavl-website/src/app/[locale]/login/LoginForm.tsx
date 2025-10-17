"use client";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModernContainer, ModernSection } from '@/components/ui/modern-layout';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginForm() {
    const t = useTranslations('auth.login');
    const common = useTranslations('common');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        const newErrors: Record<string, string> = {};
        if (!formData.email) {
            newErrors.email = t('errors.emailRequired');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = t('errors.emailInvalid');
        }
        if (!formData.password) {
            newErrors.password = t('errors.passwordRequired');
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsLoading(false);
            return;
        }
        setTimeout(() => {
            setIsLoading(false);
            console.log('Login attempt:', formData);
        }, 2000);
    };

    return (
        <div className="min-h-screen pt-20 flex items-center justify-center">
            <ModernSection background="glass" padding="xl">
                <ModernContainer variant="narrow">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="backdrop-blur-xl bg-white/5 border border-white/20 rounded-2xl p-8"
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mb-4"
                            >
                                <LogIn className="h-8 w-8 text-black" />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
                            <p className="text-white/70">{t('subtitle')}</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                {errors.password && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                        <AlertCircle className="h-4 w-4" />
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.remember}
                                        onChange={(e) => setFormData(prev => ({ ...prev, remember: e.target.checked }))}
                                        className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-0"
                                        disabled={isLoading}
                                    />
                                    <span className="text-white/80 text-sm">{t('fields.remember')}</span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                                >
                                    {t('links.forgotPassword')}
                                </Link>
                            </div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-500 hover:to-blue-500 text-black font-semibold h-12"
                            >
                                {isLoading ? common('loading') : t('submit')}
                            </Button>
                        </form>
                        <div className="mt-8 text-center">
                            <p className="text-white/70">
                                {t('noAccount')}{' '}
                                <Link
                                    href="/signup"
                                    className="text-cyan-400 hover:text-cyan-300 font-medium"
                                >
                                    {t('links.signUp')}
                                </Link>
                            </p>
                        </div>
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
