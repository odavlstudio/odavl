"use strict";
/**
 * Phase 2.3: Framework-Specific Detection Rules
 *
 * Provides framework-aware detection for:
 * - React (hooks, useEffect cleanup, component lifecycle)
 * - Express (middleware, error handling, async routes)
 * - Next.js (API routes, getServerSideProps, middleware)
 * - Node.js (streams, event emitters, workers)
 *
 * @author ODAVL Team
 * @version 2.0.0 (Phase 2)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODEJS_RULES = exports.NEXTJS_RULES = exports.EXPRESS_RULES = exports.REACT_RULES = void 0;
exports.detectFramework = detectFramework;
exports.getFrameworkRules = getFrameworkRules;
exports.checkFrameworkRules = checkFrameworkRules;
/**
 * Detect framework from file content
 */
function detectFramework(content, filePath) {
    const indicators = [];
    let framework = 'unknown';
    let confidence = 0;
    // React detection
    const reactIndicators = [
        { pattern: /import\s+.*?from\s+['"]react['"]/, weight: 40, indicator: 'React import' },
        { pattern: /useState|useEffect|useCallback|useMemo/, weight: 30, indicator: 'React Hooks' },
        { pattern: /React\.Component|React\.FC|React\.FunctionComponent/, weight: 25, indicator: 'React Component' },
        { pattern: /\.jsx|\.tsx/, weight: 20, indicator: 'JSX/TSX extension' }
    ];
    let reactConfidence = 0;
    for (const { pattern, weight, indicator } of reactIndicators) {
        if (pattern.test(content) || pattern.test(filePath)) {
            reactConfidence += weight;
            indicators.push(indicator);
        }
    }
    // Next.js detection (extends React)
    const nextIndicators = [
        { pattern: /import\s+.*?from\s+['"]next\//, weight: 40, indicator: 'Next.js import' },
        { pattern: /getServerSideProps|getStaticProps|getStaticPaths/, weight: 35, indicator: 'Next.js data fetching' },
        { pattern: /NextApiRequest|NextApiResponse/, weight: 30, indicator: 'Next.js API types' },
        { pattern: /\/app\/.*?\/route\.(ts|js)/, weight: 25, indicator: 'Next.js 13+ app dir' }
    ];
    let nextConfidence = 0;
    for (const { pattern, weight, indicator } of nextIndicators) {
        if (pattern.test(content) || pattern.test(filePath)) {
            nextConfidence += weight;
            indicators.push(indicator);
        }
    }
    // Express detection
    const expressIndicators = [
        { pattern: /import\s+.*?express\s+from\s+['"]express['"]/, weight: 40, indicator: 'Express import' },
        { pattern: /app\.get\(|app\.post\(|app\.use\(/, weight: 35, indicator: 'Express routes' },
        { pattern: /req\s*:\s*Request|res\s*:\s*Response/, weight: 30, indicator: 'Express types' },
        { pattern: /middleware|router/, weight: 20, indicator: 'Express middleware/router' }
    ];
    let expressConfidence = 0;
    for (const { pattern, weight, indicator } of expressIndicators) {
        if (pattern.test(content)) {
            expressConfidence += weight;
            indicators.push(indicator);
        }
    }
    // Vue detection
    const vueIndicators = [
        { pattern: /import\s+.*?from\s+['"]vue['"]/, weight: 40, indicator: 'Vue import' },
        { pattern: /<script setup>|<template>/, weight: 35, indicator: 'Vue SFC' },
        { pattern: /defineComponent|defineProps|defineEmits/, weight: 30, indicator: 'Vue Composition API' }
    ];
    let vueConfidence = 0;
    for (const { pattern, weight, indicator } of vueIndicators) {
        if (pattern.test(content)) {
            vueConfidence += weight;
            indicators.push(indicator);
        }
    }
    // Angular detection
    const angularIndicators = [
        { pattern: /import\s+.*?from\s+['"]@angular\//, weight: 40, indicator: 'Angular import' },
        { pattern: /@Component|@Injectable|@NgModule/, weight: 35, indicator: 'Angular decorators' },
        { pattern: /constructor.*?private.*?\)/, weight: 25, indicator: 'Angular DI pattern' }
    ];
    let angularConfidence = 0;
    for (const { pattern, weight, indicator } of angularIndicators) {
        if (pattern.test(content)) {
            angularConfidence += weight;
            indicators.push(indicator);
        }
    }
    // Determine framework (highest confidence wins)
    const frameworks = [
        { name: 'nextjs', confidence: nextConfidence },
        { name: 'react', confidence: reactConfidence },
        { name: 'express', confidence: expressConfidence },
        { name: 'vue', confidence: vueConfidence },
        { name: 'angular', confidence: angularConfidence }
    ];
    const best = frameworks.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev);
    if (best.confidence >= 40) {
        framework = best.name;
        confidence = Math.min(100, best.confidence);
    }
    else {
        // Default to Node.js if no framework detected
        framework = 'nodejs';
        confidence = 50;
    }
    return {
        framework,
        confidence,
        indicators
    };
}
/**
 * React-specific rules
 */
exports.REACT_RULES = [
    {
        framework: 'react',
        name: 'useEffect-cleanup-missing',
        description: 'useEffect with subscriptions/timers should return cleanup function',
        pattern: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?(setInterval|setTimeout|addEventListener|subscribe)\s*\([^}]*\}\s*,/,
        severity: 'high',
        suggestedFix: `
useEffect(() => {
  const timer = setInterval(() => { /* ... */ }, 1000);
  
  // ✅ Return cleanup function
  return () => {
    clearInterval(timer);
  };
}, [dependencies]);`
    },
    {
        framework: 'react',
        name: 'useState-in-loop',
        description: 'useState should not be called in loops or conditions',
        pattern: /(?:for|while|if)\s*\([^)]*\)\s*\{[\s\S]*?useState/,
        severity: 'critical',
        suggestedFix: `
// ❌ BAD: useState in conditional
if (condition) {
  const [state, setState] = useState(0); // Breaks rules of hooks
}

// ✅ GOOD: useState at top level
const [state, setState] = useState(condition ? 0 : 1);`
    },
    {
        framework: 'react',
        name: 'async-useEffect',
        description: 'useEffect callback cannot be async directly',
        pattern: /useEffect\s*\(\s*async\s*\(/,
        severity: 'high',
        suggestedFix: `
// ❌ BAD: Async useEffect
useEffect(async () => {
  const data = await fetch();
}, []);

// ✅ GOOD: Async function inside
useEffect(() => {
  async function fetchData() {
    const data = await fetch();
  }
  fetchData();
}, []);`
    }
];
/**
 * Express-specific rules
 */
exports.EXPRESS_RULES = [
    {
        framework: 'express',
        name: 'async-route-no-error-handling',
        description: 'Async Express routes must handle errors',
        pattern: /app\.(get|post|put|delete|patch)\s*\([^,]*,\s*async\s*\([^)]*\)\s*=>\s*\{(?![\s\S]*(?:try|\.catch))/,
        severity: 'high',
        suggestedFix: `
// ❌ BAD: No error handling
app.get('/api/users', async (req, res) => {
  const users = await db.query();
  res.json(users);
});

// ✅ GOOD: Try-catch or express-async-errors
app.get('/api/users', async (req, res, next) => {
  try {
    const users = await db.query();
    res.json(users);
  } catch (error) {
    next(error);
  }
});`
    },
    {
        framework: 'express',
        name: 'middleware-no-next',
        description: 'Express middleware must call next() or send response',
        pattern: /app\.use\s*\([^,]*,\s*\([^)]*\)\s*=>\s*\{(?![\s\S]*(?:next\(\)|res\.(?:send|json|end)))/,
        severity: 'critical',
        suggestedFix: `
// ❌ BAD: No next() or response
app.use((req, res) => {
  console.log(req.url);
  // Hangs the request!
});

// ✅ GOOD: Call next()
app.use((req, res, next) => {
  console.log(req.url);
  next();
});`
    }
];
/**
 * Next.js-specific rules
 */
exports.NEXTJS_RULES = [
    {
        framework: 'nextjs',
        name: 'api-route-no-export',
        description: 'Next.js API routes must export default handler',
        pattern: /NextApiRequest[\s\S]*?NextApiResponse(?![\s\S]*export\s+default)/,
        severity: 'critical',
        suggestedFix: `
// ❌ BAD: No default export
async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({ message: 'Hello' });
}

// ✅ GOOD: Default export
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  res.json({ message: 'Hello' });
}`
    },
    {
        framework: 'nextjs',
        name: 'getServerSideProps-sync',
        description: 'getServerSideProps must be async',
        pattern: /export\s+(?:const|function)\s+getServerSideProps\s*(?!=\s*async)/,
        severity: 'high',
        suggestedFix: `
// ❌ BAD: Not async
export function getServerSideProps(context) {
  return { props: {} };
}

// ✅ GOOD: Async function
export async function getServerSideProps(context) {
  const data = await fetchData();
  return { props: { data } };
}`
    }
];
/**
 * Node.js-specific rules
 */
exports.NODEJS_RULES = [
    {
        framework: 'nodejs',
        name: 'stream-no-error-handler',
        description: 'Node.js streams must have error handlers',
        pattern: /createReadStream|createWriteStream[\s\S]{0,200}(?!\.on\s*\(\s*['"]error['"])/,
        severity: 'high',
        suggestedFix: `
// ❌ BAD: No error handler
const stream = fs.createReadStream('file.txt');
stream.pipe(destination);

// ✅ GOOD: Error handler
const stream = fs.createReadStream('file.txt');
stream.on('error', (err) => {
  console.error('Stream error:', err);
});
stream.pipe(destination);`
    },
    {
        framework: 'nodejs',
        name: 'event-emitter-memory-leak',
        description: 'EventEmitter listeners should be removed',
        pattern: /\.on\s*\(\s*['"][^'"]+['"](?![\s\S]{0,500}\.(?:off|removeListener))/,
        severity: 'medium',
        suggestedFix: `
// ❌ BAD: No cleanup
emitter.on('data', handler);

// ✅ GOOD: Remove listener
emitter.on('data', handler);
// Later...
emitter.off('data', handler);

// OR: Use once() for one-time events
emitter.once('data', handler);`
    }
];
/**
 * Get all rules for a specific framework
 */
function getFrameworkRules(framework) {
    switch (framework) {
        case 'react':
            return exports.REACT_RULES;
        case 'express':
            return exports.EXPRESS_RULES;
        case 'nextjs':
            return [...exports.REACT_RULES, ...exports.NEXTJS_RULES]; // Next.js includes React
        case 'nodejs':
            return exports.NODEJS_RULES;
        default:
            return [];
    }
}
/**
 * Check file against framework-specific rules
 */
function checkFrameworkRules(content, filePath) {
    const detection = detectFramework(content, filePath);
    if (detection.confidence < 40) {
        return []; // Not confident enough in framework detection
    }
    const rules = getFrameworkRules(detection.framework);
    const violations = [];
    for (const rule of rules) {
        const matches = Array.from(content.matchAll(new RegExp(rule.pattern, 'g')));
        if (matches.length > 0) {
            violations.push({ rule, matches });
        }
    }
    return violations;
}
//# sourceMappingURL=framework-rules.js.map