// scripts/check-bundle-budget.js
// ODAVL 100/10 Wave 4: Bundle Budget Enforcement
// Checks Next.js bundle size against perf-budgets.json and .odavl/gates.yml

const fs = require('node:fs');
const path = require('node:path');
const budgets = require('../odavl-website/perf-budgets.json').budgets.routes;
const gates = require('../.odavl/gates.yml');
const yaml = require('js-yaml');

// Load global bundleKB gate
const gatesConfig = yaml.load(fs.readFileSync(path.resolve(__dirname, '../.odavl/gates.yml'), 'utf8'));
const bundleGate = gatesConfig.bundleKB || { absoluteMax: 1000 };

// Load Next.js bundle analysis (simulate, as actual file may differ)
const bundlePath = path.resolve(__dirname, '../odavl-website/.next/analyze/bundle-size.json');
if (!fs.existsSync(bundlePath)) {
    console.error('No bundle-size.json found. Skipping bundle budget check.');
    process.exit(0);
}
const bundleData = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));

let failed = false;
for (const route in budgets) {
    const routeBudget = budgets[route];
    const actual = bundleData[route] || {};
    const firstLoadKB = (actual.firstLoadJS || 0) / 1024;
    const allLoadKB = (actual.allLoadJS || 0) / 1024;
    if (firstLoadKB > Number.parseInt(routeBudget.firstLoadJS)) {
        console.error(`Route ${route} exceeds firstLoadJS budget: ${firstLoadKB}KB > ${routeBudget.firstLoadJS}`);
        failed = true;
    }
    if (allLoadKB > Number.parseInt(routeBudget.allLoadJS)) {
        console.error(`Route ${route} exceeds allLoadJS budget: ${allLoadKB}KB > ${routeBudget.allLoadJS}`);
        failed = true;
    }
    if (allLoadKB > bundleGate.absoluteMax) {
        console.error(`Route ${route} exceeds global bundleKB gate: ${allLoadKB}KB > ${bundleGate.absoluteMax}`);
        failed = true;
    }
}
if (failed) {
    process.exit(1);
} else {
    console.log('All bundle budgets passed.');
}
