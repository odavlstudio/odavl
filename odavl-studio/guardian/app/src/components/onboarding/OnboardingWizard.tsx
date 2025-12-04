/**
 * Onboarding Wizard Component
 * 
 * Week 12: Beta Launch - User Onboarding
 * 
 * Interactive multi-step onboarding wizard for new Guardian users.
 * Guides users through:
 * - Welcome & introduction
 * - Organization setup
 * - First test run creation
 * - Monitoring setup
 * - API key generation
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Rocket, Building2, TestTube, Activity, Key } from 'lucide-react';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    completed: boolean;
}

interface OnboardingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

export default function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [steps, setSteps] = useState<OnboardingStep[]>([
        {
            id: 'welcome',
            title: 'Welcome to Guardian',
            description: 'Your intelligent test orchestration platform',
            icon: Rocket,
            completed: false,
        },
        {
            id: 'organization',
            title: 'Set Up Organization',
            description: 'Create your team workspace',
            icon: Building2,
            completed: false,
        },
        {
            id: 'first-test',
            title: 'Create First Test',
            description: 'Run your first test with Guardian',
            icon: TestTube,
            completed: false,
        },
        {
            id: 'monitoring',
            title: 'Enable Monitoring',
            description: 'Set up continuous monitoring',
            icon: Activity,
            completed: false,
        },
        {
            id: 'api-key',
            title: 'Generate API Key',
            description: 'Get started with the API',
            icon: Key,
            completed: false,
        },
    ]);

    useEffect(() => {
        // Mark first step as completed when wizard opens
        if (isOpen && !steps[0].completed) {
            markStepCompleted(0);
        }
    }, [isOpen]);

    const markStepCompleted = (index: number) => {
        setSteps(prev => prev.map((step, i) =>
            i === index ? { ...step, completed: true } : step
        ));
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            markStepCompleted(currentStep);
            setCurrentStep(prev => prev + 1);
        } else {
            // Last step - complete onboarding
            markStepCompleted(currentStep);
            setTimeout(() => {
                onComplete();
                onClose();
            }, 500);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    const currentStepData = steps[currentStep];
    const StepIcon = currentStepData.icon;
    const isLastStep = currentStep === steps.length - 1;
    const progress = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress bar */}
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-800">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step indicators */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200 dark:border-gray-800">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = index === currentStep;
                        const isCompleted = step.completed;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                                <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isActive
                                                ? 'bg-blue-500 text-white scale-110'
                                                : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <Check className="w-6 h-6" />
                                    ) : (
                                        <Icon className="w-6 h-6" />
                                    )}
                                </div>
                                <span
                                    className={`text-xs font-medium transition-colors ${isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : isCompleted
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-400'
                                        }`}
                                >
                                    {step.title.split(' ')[0]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-250px)]">
                    <StepContent step={currentStepData} stepIndex={currentStep} />
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-8 py-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleSkip}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        Skip for now
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
                        >
                            {isLastStep ? (
                                <>
                                    Complete
                                    <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StepContentProps {
    step: OnboardingStep;
    stepIndex: number;
}

function StepContent({ step, stepIndex }: StepContentProps) {
    const Icon = step.icon;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-white" />
                </div>
            </div>

            {/* Title */}
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                    {step.description}
                </p>
            </div>

            {/* Step-specific content */}
            <div className="mt-8">
                {stepIndex === 0 && <WelcomeContent />}
                {stepIndex === 1 && <OrganizationContent />}
                {stepIndex === 2 && <FirstTestContent />}
                {stepIndex === 3 && <MonitoringContent />}
                {stepIndex === 4 && <ApiKeyContent />}
            </div>
        </div>
    );
}

function WelcomeContent() {
    return (
        <div className="space-y-6 text-center max-w-2xl mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300">
                Guardian is an intelligent test orchestration platform that helps you run, monitor, and analyze your tests at scale.
            </p>

            <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10x</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Faster Testing</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uptime</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">24/7</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitoring</div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Tip:</strong> This wizard will guide you through the essential setup steps. You can skip it and explore on your own anytime.
                </p>
            </div>
        </div>
    );
}

function OrganizationContent() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <p className="text-gray-700 dark:text-gray-300">
                Organizations help you manage teams, projects, and resources. Let's create your first organization.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., Acme Corp"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Organization Slug
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., acme-corp"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Used in URLs: guardian.app/acme-corp
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tier
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="free">Free (100 test runs/month)</option>
                        <option value="pro">Pro (Unlimited test runs)</option>
                        <option value="enterprise">Enterprise (Custom)</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    🎉 <strong>Free tier includes:</strong> 100 test runs, 1,000 monitor checks, and 10,000 API calls per month.
                </p>
            </div>
        </div>
    );
}

function FirstTestContent() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <p className="text-gray-700 dark:text-gray-300">
                Let's create your first test run. Guardian supports Playwright, Cypress, Jest, and more.
            </p>

            <div className="grid grid-cols-2 gap-4">
                <button className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group">
                    <div className="text-2xl mb-2">🎭</div>
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Playwright
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        E2E browser testing
                    </div>
                </button>

                <button className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group">
                    <div className="text-2xl mb-2">🌲</div>
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Cypress
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Modern E2E testing
                    </div>
                </button>

                <button className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group">
                    <div className="text-2xl mb-2">🃏</div>
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Jest
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Unit & integration tests
                    </div>
                </button>

                <button className="p-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group">
                    <div className="text-2xl mb-2">⚡</div>
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Custom
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Bring your own tests
                    </div>
                </button>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Example Test Run</h4>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                    <code>{`npx guardian run ./tests --project=my-app

✓ Running 15 tests across 3 browsers
✓ Test suite completed in 2.3s
✓ All tests passed! 🎉`}</code>
                </pre>
            </div>
        </div>
    );
}

function MonitoringContent() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <p className="text-gray-700 dark:text-gray-300">
                Set up continuous monitoring to catch issues before your users do.
            </p>

            <div className="space-y-4">
                <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1" defaultChecked />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">API Endpoint Monitoring</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Check /api/health every 5 minutes</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1" defaultChecked />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">Critical Path Testing</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Run smoke tests every 30 minutes</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1" />
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900 dark:text-white">Performance Monitoring</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Track response times and resource usage</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">
                    📊 <strong>Monitors include:</strong> Uptime tracking, performance metrics, error alerts, and detailed logs.
                </p>
            </div>
        </div>
    );
}

function ApiKeyContent() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <p className="text-gray-700 dark:text-gray-300">
                Generate an API key to integrate Guardian with your CI/CD pipeline.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Key Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g., CI/CD Pipeline"
                        defaultValue="Production API Key"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Permissions
                    </label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Read test results</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" defaultChecked />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Create test runs</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Manage monitors</span>
                        </label>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your API Key</span>
                        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            Copy
                        </button>
                    </div>
                    <code className="text-sm text-gray-900 dark:text-white font-mono break-all">
                        gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                    </code>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        ⚠️ Save this key securely. It won't be shown again.
                    </p>
                </div>
            </div>

            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Start</h4>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                    <code>{`# Install Guardian CLI
npm install -g @guardian/cli

# Configure API key
export GUARDIAN_API_KEY=gsk_xxx...

# Run tests
guardian run ./tests`}</code>
                </pre>
            </div>

            <div className="text-center mt-8">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    🎉 You're all set!
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                    Click Complete to start using Guardian
                </p>
            </div>
        </div>
    );
}
