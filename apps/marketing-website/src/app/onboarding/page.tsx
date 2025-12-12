'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'signup' | 'organization' | 'project' | 'invite' | 'complete';

interface OnboardingState {
  email: string;
  password: string;
  organizationName: string;
  projectName: string;
  projectRepo: string;
  invites: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('signup');
  const [state, setState] = useState<OnboardingState>({
    email: '',
    password: '',
    organizationName: '',
    projectName: '',
    projectRepo: '',
    invites: [],
  });

  const handleNext = () => {
    const steps: OnboardingStep[] = ['signup', 'organization', 'project', 'invite', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['signup', 'organization', 'project', 'invite', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = () => {
    // Redirect to console
    router.push('/console');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-brand-blue/10 to-brand-purple/10 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <StepIndicator step="signup" current={currentStep} label="Sign Up" />
            <StepIndicator step="organization" current={currentStep} label="Organization" />
            <StepIndicator step="project" current={currentStep} label="Project" />
            <StepIndicator step="invite" current={currentStep} label="Invite Team" />
            <StepIndicator step="complete" current={currentStep} label="Complete" />
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-brand-blue to-brand-purple rounded-full transition-all duration-300"
              style={{
                width: `${(((['signup', 'organization', 'project', 'invite', 'complete'].indexOf(currentStep) + 1) / 5) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          {currentStep === 'signup' && (
            <SignupStep state={state} setState={setState} onNext={handleNext} />
          )}
          {currentStep === 'organization' && (
            <OrganizationStep state={state} setState={setState} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'project' && (
            <ProjectStep state={state} setState={setState} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'invite' && (
            <InviteStep state={state} setState={setState} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 'complete' && (
            <CompleteStep onComplete={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step, current, label }: { step: OnboardingStep; current: OnboardingStep; label: string }) {
  const steps: OnboardingStep[] = ['signup', 'organization', 'project', 'invite', 'complete'];
  const stepIndex = steps.indexOf(step);
  const currentIndex = steps.indexOf(current);
  const isActive = stepIndex === currentIndex;
  const isCompleted = stepIndex < currentIndex;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
          isCompleted ? 'bg-brand-green text-white' : isActive ? 'bg-brand-blue text-white' : 'bg-white/20 text-gray-400'
        }`}
      >
        {isCompleted ? '✓' : stepIndex + 1}
      </div>
      <span className={`text-xs ${isActive ? 'text-white font-semibold' : 'text-gray-400'}`}>{label}</span>
    </div>
  );
}

function SignupStep({ state, setState, onNext }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
      <p className="text-gray-300 mb-6">Start your ODAVL Studio journey</p>
      <div className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">Email</label>
          <input
            type="email"
            value={state.email}
            onChange={(e) => setState({ ...state, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="your.email@company.com"
          />
        </div>
        <div>
          <label className="block text-white font-semibold mb-2">Password</label>
          <input
            type="password"
            value={state.password}
            onChange={(e) => setState({ ...state, password: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="••••••••"
          />
        </div>
        <button
          onClick={onNext}
          disabled={!state.email || !state.password}
          className="w-full py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function OrganizationStep({ state, setState, onNext, onBack }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Create Your Organization</h2>
      <p className="text-gray-300 mb-6">Set up your workspace</p>
      <div className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">Organization Name</label>
          <input
            type="text"
            value={state.organizationName}
            onChange={(e) => setState({ ...state, organizationName: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Acme Inc."
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!state.organizationName}
            className="flex-1 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectStep({ state, setState, onNext, onBack }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Create Your First Project</h2>
      <p className="text-gray-300 mb-6">Connect your codebase</p>
      <div className="space-y-4">
        <div>
          <label className="block text-white font-semibold mb-2">Project Name</label>
          <input
            type="text"
            value={state.projectName}
            onChange={(e) => setState({ ...state, projectName: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="My App"
          />
        </div>
        <div>
          <label className="block text-white font-semibold mb-2">Repository URL (Optional)</label>
          <input
            type="text"
            value={state.projectRepo}
            onChange={(e) => setState({ ...state, projectRepo: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="https://github.com/yourorg/repo"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!state.projectName}
            className="flex-1 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function InviteStep({ state, setState, onNext, onBack }: any) {
  const [email, setEmail] = useState('');

  const addInvite = () => {
    if (email && !state.invites.includes(email)) {
      setState({ ...state, invites: [...state.invites, email] });
      setEmail('');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Invite Your Team</h2>
      <p className="text-gray-300 mb-6">Collaborate with teammates (optional)</p>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addInvite()}
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="teammate@company.com"
          />
          <button
            onClick={addInvite}
            className="px-6 py-3 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition font-semibold"
          >
            Add
          </button>
        </div>
        {state.invites.length > 0 && (
          <div className="space-y-2">
            {state.invites.map((invite: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white/10 px-4 py-2 rounded-lg">
                <span className="text-white">{invite}</span>
                <button
                  onClick={() => setState({ ...state, invites: state.invites.filter((_: any, i: number) => i !== idx) })}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-3 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition font-semibold"
          >
            {state.invites.length > 0 ? 'Send Invites & Continue' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompleteStep({ onComplete }: any) {
  return (
    <div className="text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
      <p className="text-gray-300 mb-8">
        Your ODAVL Studio workspace is ready. Let's start analyzing your code.
      </p>
      <button
        onClick={onComplete}
        className="w-full py-3 bg-gradient-to-r from-brand-blue to-brand-purple text-white rounded-lg hover:opacity-90 transition font-semibold"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
