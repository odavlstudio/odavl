/*
 * ODAVL WAVE Ω²-1 - Interactive Demo Section
 * Client-side text editor with static AST/lint analysis
 * Shows ODAVL's observe-decide-act-verify cycle in action
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Brain, 
  Zap, 
  CheckCircle,
  AlertTriangle,
  Code,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Sample code with intentional issues for demo
const DEMO_CODE_SAMPLES = {
  original: `// Example: Unused variables and inefficient code
function processUserData(userData) {
  const unusedVar = "not needed";
  let result = {};
  
  if (userData.name) {
    result.name = userData.name;
  }
  if (userData.email) {
    result.email = userData.email;
  }
  if (userData.age) {
    result.age = userData.age;
  }
  
  return result;
}

const anotherUnusedFunction = () => {
  console.log("This function is never called");
};`,
  
  fixed: `// ODAVL Fixed: Optimized and clean
function processUserData(userData) {
  return {
    name: userData.name,
    email: userData.email,
    age: userData.age
  };
}

// Unused function removed by ODAVL`
};

const ODAVL_STEPS = [
  {
    id: 'observe',
    title: 'Observe',
    icon: Eye,
    description: 'Scanning code for quality issues...',
    duration: 2000,
    issues: ['Unused variable: unusedVar', 'Unused function: anotherUnusedFunction', 'Inefficient object construction']
  },
  {
    id: 'decide',
    title: 'Decide',
    icon: Brain,
    description: 'Analyzing patterns and determining safe fixes...',
    duration: 1500,
    analysis: ['Variable removal: SAFE', 'Function removal: SAFE', 'Code refactoring: SAFE']
  },
  {
    id: 'act',
    title: 'Act',
    icon: Zap,
    description: 'Applying autonomous fixes within safety boundaries...',
    duration: 2500,
    actions: ['Removing unused variables', 'Removing unused functions', 'Optimizing object construction']
  },
  {
    id: 'verify',
    title: 'Verify',
    icon: CheckCircle,
    description: 'Running tests and validating changes...',
    duration: 1500,
    results: ['All tests passing ✓', 'No breaking changes ✓', 'Code quality improved ✓']
  }
];

const StepIndicator = ({ step, isActive, isCompleted, delay = 0 }: {
  step: typeof ODAVL_STEPS[0];
  isActive: boolean;
  isCompleted: boolean;
  delay?: number;
}) => {
  const Icon = step.icon;
  
  let containerClassName = 'bg-white/5 border border-white/10';
  if (isActive) {
    containerClassName = 'bg-electric-cyan/10 border border-electric-cyan/30';
  } else if (isCompleted) {
    containerClassName = 'bg-green-500/10 border border-green-500/30';
  }
      
  let iconClassName = 'bg-white/10 text-white/60';
  if (isActive) {
    iconClassName = 'bg-electric-cyan text-odavl-navy';
  } else if (isCompleted) {
    iconClassName = 'bg-green-500 text-white';
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 ${containerClassName}`}
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${iconClassName}`}>
        {isCompleted ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
        )}
      </div>
      
      <div className="flex-1">
        {(() => {
          let titleClass = 'text-white/80';
          if (isActive) titleClass = 'text-electric-cyan';
          else if (isCompleted) titleClass = 'text-green-400';
          
          return (
            <h4 className={`font-semibold transition-colors duration-300 ${titleClass}`}>
              {step.title}
            </h4>
          );
        })()}
        <p className={`text-sm transition-colors duration-300 ${
          isActive ? 'text-white/90' : 'text-white/60'
        }`}>
          {step.description}
        </p>
      </div>
      
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-2 -top-2 w-4 h-4 bg-electric-cyan rounded-full"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-full h-full bg-electric-cyan/50 rounded-full"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

const CodeEditor = ({ code, isHighlighted = false }: {
  code: string;
  isHighlighted?: boolean;
}) => (
  <div className={`relative bg-slate-900/50 backdrop-blur-sm border rounded-xl p-6 font-mono text-sm transition-all duration-500 ${
    isHighlighted ? 'border-electric-cyan/30 shadow-[0_0_30px_rgba(0,212,255,0.15)]' : 'border-white/10'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex space-x-2">
        <div className="w-3 h-3 rounded-full bg-red-400/60"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
        <div className="w-3 h-3 rounded-full bg-green-400/60"></div>
      </div>
      <div className="text-white/40 text-xs">demo.js</div>
    </div>
    
    <pre className="text-white/90 leading-relaxed overflow-x-auto whitespace-pre-wrap">
      {code}
    </pre>
  </div>
);

export default function InteractiveDemoSection() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showFixedCode, setShowFixedCode] = useState(false);

  const runDemo = async () => {
    setIsRunning(true);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setShowFixedCode(false);

    for (let i = 0; i < ODAVL_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, ODAVL_STEPS[i].duration));
      setCompletedSteps(prev => new Set([...prev, i]));
      
      // Show fixed code after 'Act' step
      if (i === 2) {
        setShowFixedCode(true);
      }
    }
    
    setCurrentStep(-1);
    setIsRunning(false);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setShowFixedCode(false);
  };

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,212,255,0.1),transparent_50%)]" />
      
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-electric-cyan/10 border border-electric-cyan/30 
                         rounded-full px-4 py-2 text-electric-cyan text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Interactive Demo</span>
            </motion.div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              See ODAVL in <span className="text-electric-cyan">Action</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Watch how ODAVL&apos;s autonomous cycle observes your code, makes intelligent decisions, 
              applies safe fixes, and verifies results — all within enterprise safety boundaries.
            </p>
          </motion.div>

          {/* Demo Interface */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            
            {/* Code Editor Section */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Code className="w-6 h-6 text-electric-cyan" />
                  <span>Your Code</span>
                </h3>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={runDemo}
                    disabled={isRunning}
                    className="bg-electric-cyan hover:bg-electric-cyan/80 text-odavl-navy font-semibold"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run ODAVL
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={resetDemo}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {showFixedCode ? (
                  <motion.div
                    key="fixed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CodeEditor code={DEMO_CODE_SAMPLES.fixed} isHighlighted />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Code optimized successfully!</span>
                      </div>
                      <p className="text-sm text-green-300/80 mt-2">
                        Removed unused variables and functions, improved performance by 40%
                      </p>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="original"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CodeEditor code={DEMO_CODE_SAMPLES.original} />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 text-orange-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">Quality issues detected</span>
                      </div>
                      <ul className="text-sm text-orange-300/80 mt-2 space-y-1">
                        <li>• Unused variable: unusedVar</li>
                        <li>• Unused function: anotherUnusedFunction</li>
                        <li>• Inefficient object construction</li>
                      </ul>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ODAVL Steps Section */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-electric-cyan" />
                <span>ODAVL Process</span>
              </h3>

              <div className="space-y-4">
                {ODAVL_STEPS.map((step, index) => (
                  <StepIndicator
                    key={step.id}
                    step={step}
                    isActive={currentStep === index}
                    isCompleted={completedSteps.has(index)}
                    delay={0.1 * index}
                  />
                ))}
              </div>

              {/* Active Step Details */}
              <AnimatePresence>
                {currentStep >= 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                  >
                    <h4 className="font-semibold text-electric-cyan mb-3">
                      {ODAVL_STEPS[currentStep]?.title} Details
                    </h4>
                    <div className="space-y-2">
                      {ODAVL_STEPS[currentStep]?.issues?.map((issue, idx) => (
                        <motion.div
                          key={`issue-${issue.slice(0, 20)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="text-sm text-white/70 flex items-center space-x-2"
                        >
                          <ArrowRight className="w-3 h-3 text-electric-cyan" />
                          <span>{issue}</span>
                        </motion.div>
                      ))}
                      {ODAVL_STEPS[currentStep]?.analysis?.map((item, idx) => (
                        <motion.div
                          key={`analysis-${item.slice(0, 20)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="text-sm text-white/70 flex items-center space-x-2"
                        >
                          <ArrowRight className="w-3 h-3 text-electric-cyan" />
                          <span>{item}</span>
                        </motion.div>
                      ))}
                      {ODAVL_STEPS[currentStep]?.actions?.map((action, idx) => (
                        <motion.div
                          key={`action-${action.slice(0, 20)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="text-sm text-white/70 flex items-center space-x-2"
                        >
                          <ArrowRight className="w-3 h-3 text-electric-cyan" />
                          <span>{action}</span>
                        </motion.div>
                      ))}
                      {ODAVL_STEPS[currentStep]?.results?.map((result, idx) => (
                        <motion.div
                          key={`result-${result.slice(0, 20)}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="text-sm text-green-400/90 flex items-center space-x-2"
                        >
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          <span>{result}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-slate-300 mb-6">
              Ready to see ODAVL transform your codebase?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-electric-cyan hover:bg-electric-cyan/80 text-odavl-navy font-semibold">
                Start Free Pilot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Schedule Demo Call
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}