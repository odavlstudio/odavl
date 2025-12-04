/**
 * Beta Sign-up Landing Page Component
 * Week 13-14: Beta Recruitment
 * Phase 3 Month 4
 */

'use client';

import { useState } from 'react';

interface BetaSignup {
    name?: string;
    email?: string;
    company?: string;
    role?: 'developer' | 'lead' | 'manager' | 'founder' | 'other';
    teamSize?: '1' | '2-10' | '11-50' | '51-200' | '200+';
    primaryLanguage?: 'typescript' | 'javascript' | 'python' | 'java' | 'other';
    usesCI?: boolean;
    useCase?: string;
    hearAbout?: 'product-hunt' | 'y-combinator' | 'dev-to' | 'linkedin' | 'github' | 'twitter' | 'reddit' | 'friend' | 'other';
    weeklyFeedback?: boolean;
    caseStudy?: boolean;
}

export function BetaSignupForm() {
    const [formData, setFormData] = useState<Partial<BetaSignup>>({
        weeklyFeedback: false,
        caseStudy: false,
        usesCI: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);

        try {
            const response = await fetch('/api/beta/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            setResult(data);

            if (data.success) {
                // Reset form
                setFormData({
                    weeklyFeedback: false,
                    caseStudy: false,
                    usesCI: false,
                });
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Failed to submit. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        Join ODAVL Beta Program
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Be among the first 50 developers to experience autonomous code quality.
                        Get <strong>6 months free</strong> + exclusive access to new features.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">50</div>
                            <div className="text-sm text-muted-foreground">Beta Spots</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">6</div>
                            <div className="text-sm text-muted-foreground">Months Free</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">$0</div>
                            <div className="text-sm text-muted-foreground">Cost</div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    {result && (
                        <div
                            className={`mb-6 p-4 rounded-lg ${
                                result.success
                                    ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100'
                                    : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100'
                            }`}
                        >
                            {result.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">About You</h3>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2"
                                    placeholder="john@company.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Company</label>
                                    <input
                                        type="text"
                                        value={formData.company || ''}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full border rounded-lg px-4 py-2"
                                        placeholder="Acme Inc"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Role *</label>
                                    <select
                                        required
                                        value={formData.role || ''}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                        className="w-full border rounded-lg px-4 py-2"
                                    >
                                        <option value="">Select role</option>
                                        <option value="developer">Developer</option>
                                        <option value="lead">Tech Lead</option>
                                        <option value="manager">Engineering Manager</option>
                                        <option value="founder">Founder/CTO</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Team Size *</label>
                                <select
                                    required
                                    value={formData.teamSize || ''}
                                    onChange={e => setFormData({ ...formData, teamSize: e.target.value as any })}
                                    className="w-full border rounded-lg px-4 py-2"
                                >
                                    <option value="">Select size</option>
                                    <option value="1">Just me</option>
                                    <option value="2-10">2-10 developers</option>
                                    <option value="11-50">11-50 developers</option>
                                    <option value="51-200">51-200 developers</option>
                                    <option value="200+">200+ developers</option>
                                </select>
                            </div>
                        </div>

                        {/* Tech Stack */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Your Tech Stack</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">Primary Language *</label>
                                <select
                                    required
                                    value={formData.primaryLanguage || ''}
                                    onChange={e => setFormData({ ...formData, primaryLanguage: e.target.value as any })}
                                    className="w-full border rounded-lg px-4 py-2"
                                >
                                    <option value="">Select language</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.usesCI || false}
                                    onChange={e => setFormData({ ...formData, usesCI: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm">We use CI/CD (GitHub Actions, GitLab CI, etc.)</span>
                            </label>
                        </div>

                        {/* Use Case */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Tell Us More</h3>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    What problems are you trying to solve? *
                                </label>
                                <textarea
                                    required
                                    value={formData.useCase || ''}
                                    onChange={e => setFormData({ ...formData, useCase: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2 h-24"
                                    placeholder="e.g., Too many bugs in production, slow code reviews, technical debt..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    How did you hear about us? *
                                </label>
                                <select
                                    required
                                    value={formData.hearAbout || ''}
                                    onChange={e => setFormData({ ...formData, hearAbout: e.target.value as any })}
                                    className="w-full border rounded-lg px-4 py-2"
                                >
                                    <option value="">Select source</option>
                                    <option value="product-hunt">Product Hunt</option>
                                    <option value="y-combinator">Y Combinator</option>
                                    <option value="dev-to">Dev.to</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="github">GitHub</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="reddit">Reddit</option>
                                    <option value="friend">Friend/Colleague</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Commitment */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-lg font-semibold">Beta Commitment</h3>
                            <p className="text-sm text-muted-foreground">
                                To ensure mutual success, we ask beta participants to:
                            </p>

                            <label className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.weeklyFeedback || false}
                                    onChange={e => setFormData({ ...formData, weeklyFeedback: e.target.checked })}
                                    className="rounded mt-1"
                                />
                                <span className="text-sm">
                                    I commit to <strong>weekly feedback calls</strong> (30 min) to help improve the product
                                </span>
                            </label>

                            <label className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.caseStudy || false}
                                    onChange={e => setFormData({ ...formData, caseStudy: e.target.checked })}
                                    className="rounded mt-1"
                                />
                                <span className="text-sm">
                                    I agree to participate in a <strong>case study</strong> if the product works well for us
                                </span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Apply for Beta Access'}
                        </button>

                        <p className="text-xs text-center text-muted-foreground">
                            We review applications within 24 hours. Selected participants get immediate access.
                        </p>
                    </form>
                </div>

                {/* Benefits */}
                <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="text-center">
                        <div className="text-4xl mb-2">🚀</div>
                        <h3 className="font-semibold mb-2">Early Access</h3>
                        <p className="text-sm text-muted-foreground">
                            Be first to try new features and shape the roadmap
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl mb-2">💰</div>
                        <h3 className="font-semibold mb-2">6 Months Free</h3>
                        <p className="text-sm text-muted-foreground">
                            Full access to all ODAVL products, no credit card required
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl mb-2">🤝</div>
                        <h3 className="font-semibold mb-2">Direct Support</h3>
                        <p className="text-sm text-muted-foreground">
                            Weekly calls with founders, priority bug fixes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
