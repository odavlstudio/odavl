// ODAVL Wave 3 - Color Contrast Test
// Manual validation of WCAG 2.2 color contrast requirements

function calculateContrast(color1, color2) {
  const getRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const getLuminance = (rgb) => {
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const lum1 = getLuminance(getRGB(color1));
  const lum2 = getLuminance(getRGB(color2));
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

  let level;
  if (ratio >= 7) {
    level = 'AAA';
  } else if (ratio >= 4.5) {
    level = 'AA';
  } else {
    level = 'FAIL';
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    level,
    passes: ratio >= 4.5
  };
}

console.log('🎨 ODAVL Color Contrast Analysis - WCAG 2.2 AA\n');

const testCombinations = [
  { name: 'Navy on White', bg: '#ffffff', fg: '#0f3460', usage: 'Primary text on light backgrounds' },
  { name: 'White on Navy', bg: '#0f3460', fg: '#ffffff', usage: 'Text on navigation/hero sections' },
  { name: 'Cyan on Navy', bg: '#0f3460', fg: '#00d4ff', usage: 'Accent text on dark backgrounds' },
  { name: 'Navy on Cyan', bg: '#00d4ff', fg: '#0f3460', usage: 'Primary buttons' },
  { name: 'Gray on White', bg: '#ffffff', fg: '#64748b', usage: 'Secondary text' },
  { name: 'Light Gray on White', bg: '#ffffff', fg: '#94a3b8', usage: 'Muted text' },
  { name: 'Dark Gray on Light', bg: '#f8fafc', fg: '#1e293b', usage: 'Body text on light gray' },
  { name: 'White on Dark Gray', bg: '#1e293b', fg: '#ffffff', usage: 'Text on dark cards' },
  { name: 'Cyan on Dark', bg: '#0c4a6e', fg: '#00d4ff', usage: 'Links on dark blue' },
  { name: 'Light Blue on Navy', bg: '#0f3460', fg: '#3b82f6', usage: 'Secondary elements' }
];

console.log('Contrast Ratio Analysis:');
console.log('=======================\n');

let passCount = 0;
let totalCount = testCombinations.length;

testCombinations.forEach(combo => {
  const result = calculateContrast(combo.fg, combo.bg);
  const status = result.passes ? '✅ PASS' : '❌ FAIL';
  let level;
  if (result.level === 'AAA') {
    level = '(AAA)';
  } else if (result.level === 'AA') {
    level = '(AA)';
  } else {
    level = '(FAIL)';
  }
  
  console.log(`${status} ${combo.name}`);
  console.log(`     Ratio: ${result.ratio}:1 ${level}`);
  console.log(`     Usage: ${combo.usage}`);
  console.log(`     Colors: ${combo.fg} on ${combo.bg}\n`);
  
  if (result.passes) passCount++;
});

console.log('Summary:');
console.log('========');
console.log(`✅ Passing: ${passCount}/${totalCount} (${Math.round(passCount/totalCount*100)}%)`);
console.log(`❌ Failing: ${totalCount - passCount}/${totalCount}`);

if (passCount === totalCount) {
  console.log('\n🎉 All color combinations meet WCAG 2.2 AA standards!');
} else {
  console.log('\n⚠️  Some color combinations need adjustment for full compliance.');
  console.log('   Recommendation: Darken light colors or lighten dark colors to improve contrast.');
}

// WCAG Guidelines Reminder
console.log('\nWCAG 2.2 AA Requirements:');
console.log('• Normal text: 4.5:1 minimum contrast ratio');
console.log('• Large text (18pt+): 3:1 minimum contrast ratio');
console.log('• AAA level: 7:1 for normal text, 4.5:1 for large text');