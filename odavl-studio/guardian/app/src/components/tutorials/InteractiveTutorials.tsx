/**
 * Interactive Tutorial Component
 * 
 * Week 12: Beta Launch - Interactive Tutorials
 * 
 * Provides step-by-step interactive tutorials for key Guardian features.
 */

'use client';

import { useState } from 'react';
import { Play, Check, X, ChevronRight, Book, Code, Zap } from 'lucide-react';

interface Tutorial {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    duration: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    steps: TutorialStep[];
}

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    codeExample?: string;
    actionRequired?: boolean;
    checkmark?: () => boolean;
}

const tutorials: Tutorial[] = [
    {
        id: 'first-test-run',
        title: 'Your First Test Run',
        description: 'Learn how to create and execute your first test run',
        icon: Play,
        duration: '5 min',
        difficulty: 'beginner',
        steps: [
            {
                id: 'install-cli',
                title: 'Install Guardian CLI',
                description: 'Install the Guardian CLI tool globally on your system',
                codeExample: 'npm install -g @guardian/cli',
                actionRequired: true,
            },
            {
                id: 'configure-api',
                title: 'Configure API Key',
                description: 'Set your API key as an environment variable',
                codeExample: 'export GUARDIAN_API_KEY=gsk_your_key_here',
                actionRequired: true,
            },
            {
                id: 'run-tests',
                title: 'Run Your Tests',
                description: 'Execute your test suite with Guardian',
                codeExample: 'guardian run ./tests --project=my-app',
                actionRequired: true,
            },
            {
                id: 'view-results',
                title: 'View Results',
                description: 'Check your test results in the Guardian dashboard',
                actionRequired: false,
            },
        ],
    },
    {
        id: 'setup-monitoring',
        title: 'Set Up Monitoring',
        description: 'Configure continuous monitoring for your application',
        icon: Zap,
        duration: '10 min',
        difficulty: 'intermediate',
        steps: [
            {
                id: 'create-monitor',
                title: 'Create Monitor',
                description: 'Set up a new monitor for your endpoint',
                actionRequired: true,
            },
            {
                id: 'configure-alerts',
                title: 'Configure Alerts',
                description: 'Set up notifications for monitor failures',
                actionRequired: true,
            },
            {
                id: 'test-monitor',
                title: 'Test Monitor',
                description: 'Run a test check to ensure monitor is working',
                actionRequired: true,
            },
            {
                id: 'view-metrics',
                title: 'View Metrics',
                description: 'Check uptime and performance metrics',
                actionRequired: false,
            },
        ],
    },
    {
        id: 'api-integration',
        title: 'API Integration',
        description: 'Integrate Guardian with your CI/CD pipeline',
        icon: Code,
        duration: '15 min',
        difficulty: 'advanced',
        steps: [
            {
                id: 'generate-api-key',
                title: 'Generate API Key',
                description: 'Create an API key with appropriate permissions',
                actionRequired: true,
            },
            {
                id: 'setup-cicd',
                title: 'Configure CI/CD',
                description: 'Add Guardian to your GitHub Actions or GitLab CI',
                codeExample: `# .github/workflows/test.yml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests with Guardian
        env:
          GUARDIAN_API_KEY: \${{ secrets.GUARDIAN_API_KEY }}
        run: |
          npm install -g @guardian/cli
          guardian run ./tests`,
                actionRequired: true,
            },
            {
                id: 'webhook-integration',
                title: 'Set Up Webhooks',
                description: 'Configure webhooks for real-time notifications',
                actionRequired: true,
            },
            {
                id: 'verify-integration',
                title: 'Verify Integration',
                description: 'Push a commit and verify tests run automatically',
                actionRequired: false,
            },
        ],
    },
];

export default function InteractiveTutorials() {
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    const handleStartTutorial = (tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setCurrentStep(0);
        setCompletedSteps(new Set());
    };

    const handleCompleteStep = () => {
        if (selectedTutorial) {
            const stepId = selectedTutorial.steps[currentStep].id;
            setCompletedSteps(prev => new Set([...prev, stepId]));

            if (currentStep < selectedTutorial.steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            }
        }
    };

    const handleNextStep = () => {
        if (selectedTutorial && currentStep < selectedTutorial.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleCloseTutorial = () => {
        setSelectedTutorial(null);
        setCurrentStep(0);
    };

    if (!selectedTutorial) {
        return (
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Interactive Tutorials
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Learn Guardian step-by-step with interactive hands-on tutorials
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutorials.map((tutorial) => {
                        const Icon = tutorial.icon;
                        const difficultyColors = {
                            beginner: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                            intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                            advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
                        };

                        return (
                            <div
                                key={tutorial.id}
                                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {tutorial.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {tutorial.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${difficultyColors[tutorial.difficulty]}`}>
                                        {tutorial.difficulty}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {tutorial.duration}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {tutorial.steps.length} steps
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleStartTutorial(tutorial)}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4" />
                                    Start Tutorial
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    const currentStepData = selectedTutorial.steps[currentStep];
    const isStepCompleted = completedSteps.has(currentStepData.id);
    const progress = ((currentStep + 1) / selectedTutorial.steps.length) * 100;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <Book className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {selectedTutorial.title}
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Step {currentStep + 1} of {selectedTutorial.steps.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCloseTutorial}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {currentStepData.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {currentStepData.description}
                            </p>
                        </div>

                        {currentStepData.codeExample && (
                            <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400">Code Example</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(currentStepData.codeExample!)}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="text-sm">
                                    <code>{currentStepData.codeExample}</code>
                                </pre>
                            </div>
                        )}

                        {currentStepData.actionRequired && !isStepCompleted && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                    ⚡ <strong>Action Required:</strong> Complete this step before proceeding.
                                </p>
                            </div>
                        )}

                        {isStepCompleted && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-800 dark:text-green-400">
                                    <strong>Step Completed!</strong> Ready to move on.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePreviousStep}
                            disabled={currentStep === 0}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        <div className="flex gap-3">
                            {currentStepData.actionRequired && !isStepCompleted && (
                                <button
                                    onClick={handleCompleteStep}
                                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Mark Complete
                                </button>
                            )}

                            {(!currentStepData.actionRequired || isStepCompleted) && (
                                <button
                                    onClick={currentStep === selectedTutorial.steps.length - 1 ? handleCloseTutorial : handleNextStep}
                                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
                                >
                                    {currentStep === selectedTutorial.steps.length - 1 ? (
                                        <>
                                            Finish
                                            <Check className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
