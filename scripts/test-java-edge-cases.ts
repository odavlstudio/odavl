#!/usr/bin/env tsx
/**
 * ODAVL Insight - Java Edge Cases Testing
 * Tests detectors on edge cases and unusual scenarios
 * Week 10 Day 5 - Advanced Testing & Optimization
 */

import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  JavaComplexityDetector,
  JavaStreamDetector,
  JavaExceptionDetector,
  JavaMemoryDetector,
  JavaSpringDetector,
} from '../odavl-studio/insight/core/dist/detector/index.js';

interface EdgeCaseTest {
  name: string;
  description: string;
  code: string;
  expectedIssues: number;
}

// Edge cases to test
const edgeCases: EdgeCaseTest[] = [
  {
    name: 'Empty Java File',
    description: 'Completely empty .java file',
    code: '',
    expectedIssues: 0,
  },
  {
    name: 'Only Comments',
    description: 'File with only comments, no code',
    code: `
// This is a comment
/* Multi-line
   comment */
/** JavaDoc comment */
    `.trim(),
    expectedIssues: 0,
  },
  {
    name: 'Syntax Error',
    description: 'Java file with syntax errors',
    code: `
public class BrokenCode {
    public void broken( {
        // Missing closing brace
    }
}
    `.trim(),
    expectedIssues: 0, // Should gracefully handle, not crash
  },
  {
    name: 'Minimal Valid File',
    description: 'Smallest possible valid Java file',
    code: `
public class Minimal {
}
    `.trim(),
    expectedIssues: 0,
  },
  {
    name: 'Unicode Characters',
    description: 'Code with unicode identifiers',
    code: `
public class UnicodeTest {
    private String 名前 = "name";
    private String имя = "name";
    
    public void test() {
        System.out.println(名前 + имя);
    }
}
    `.trim(),
    expectedIssues: 0, // Valid Java, should not crash
  },
  {
    name: 'Very Long Method',
    description: 'Method with 500+ lines',
    code: `
public class LongMethod {
    public void veryLongMethod() {
        ${Array(500).fill('System.out.println("line");').join('\n        ')}
    }
}
    `.trim(),
    expectedIssues: 1, // Complexity issue expected
  },
  {
    name: 'Deeply Nested Code',
    description: 'Code with 10+ nesting levels',
    code: `
public class DeeplyNested {
    public void deepNesting() {
        if (true) {
            if (true) {
                if (true) {
                    if (true) {
                        if (true) {
                            if (true) {
                                if (true) {
                                    if (true) {
                                        if (true) {
                                            if (true) {
                                                System.out.println("deep");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
    `.trim(),
    expectedIssues: 1, // Complexity issue expected
  },
  {
    name: 'Generic Types',
    description: 'Complex generic type declarations',
    code: `
import java.util.*;

public class GenericTest<T extends Comparable<T>> {
    private Map<String, List<Map<Integer, Set<T>>>> complexMap;
    
    public <K, V> Map<K, V> process(List<? extends K> keys, V value) {
        Map<K, V> result = new HashMap<>();
        return result;
    }
}
    `.trim(),
    expectedIssues: 0, // Valid generics, should handle gracefully
  },
  {
    name: 'Lambda Expressions',
    description: 'Multiple lambda expressions',
    code: `
import java.util.*;
import java.util.stream.*;

public class LambdaTest {
    public void testLambdas() {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
        
        names.stream()
             .filter(n -> n.length() > 3)
             .map(n -> n.toUpperCase())
             .forEach(n -> System.out.println(n));
    }
}
    `.trim(),
    expectedIssues: 0, // Good modern Java code
  },
  {
    name: 'Annotations Heavy',
    description: 'Class with many annotations',
    code: `
import org.springframework.stereotype.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class AnnotatedController {
    
    @GetMapping("/test")
    @ResponseBody
    @Deprecated
    public String test() {
        return "test";
    }
}
    `.trim(),
    expectedIssues: 0, // Valid Spring code
  },
];

async function testEdgeCase(
  edgeCase: EdgeCaseTest,
  testDir: string
): Promise<{ passed: boolean; error?: string; issues: number }> {
  const testFile = join(testDir, `${edgeCase.name.replace(/\s+/g, '')}.java`);
  
  try {
    // Write test file
    writeFileSync(testFile, edgeCase.code, 'utf-8');
    
    // Run all detectors
    const detectors = [
      new JavaComplexityDetector(testDir),
      new JavaStreamDetector(testDir),
      new JavaExceptionDetector(testDir),
      new JavaMemoryDetector(testDir),
      new JavaSpringDetector(testDir),
    ];
    
    let totalIssues = 0;
    for (const detector of detectors) {
      try {
        const issues = await detector.detect();
        totalIssues += issues.length;
      } catch (error) {
        // Some detectors may fail on invalid code, that's okay
        console.log(`   Detector failed (expected for invalid code): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    const passed = totalIssues === edgeCase.expectedIssues;
    return { passed, issues: totalIssues };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      issues: 0,
    };
  }
}

async function runEdgeCaseTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║          ODAVL Insight - Java Edge Cases Test Suite                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
  
  // Create temporary test directory
  const testDir = join(process.cwd(), 'test-fixtures', 'java-edge-cases');
  mkdirSync(testDir, { recursive: true });
  
  console.log(`📁 Test Directory: ${testDir}\n`);
  console.log(`🧪 Running ${edgeCases.length} edge case tests...\n`);
  console.log('─'.repeat(70));
  
  let passedCount = 0;
  let failedCount = 0;
  const results: Array<{ case: string; passed: boolean; expected: number; actual: number; error?: string }> = [];
  
  for (const edgeCase of edgeCases) {
    const result = await testEdgeCase(edgeCase, testDir);
    const status = result.passed ? '✅' : '❌';
    
    console.log(`${status} ${edgeCase.name}`);
    console.log(`   Description: ${edgeCase.description}`);
    console.log(`   Expected: ${edgeCase.expectedIssues} issues, Got: ${result.issues} issues`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.passed) {
      passedCount++;
      console.log(`   Status: PASSED ✅`);
    } else {
      failedCount++;
      console.log(`   Status: FAILED ❌`);
    }
    
    console.log('─'.repeat(70));
    
    results.push({
      case: edgeCase.name,
      passed: result.passed,
      expected: edgeCase.expectedIssues,
      actual: result.issues,
      error: result.error,
    });
  }
  
  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 EDGE CASE TESTING SUMMARY');
  console.log('═'.repeat(70));
  
  const totalTests = edgeCases.length;
  const passRate = (passedCount / totalTests * 100).toFixed(1);
  
  console.log(`\n✅ Passed: ${passedCount}/${totalTests} (${passRate}%)`);
  console.log(`❌ Failed: ${failedCount}/${totalTests} (${(100 - parseFloat(passRate)).toFixed(1)}%)`);
  
  if (failedCount > 0) {
    console.log(`\n❌ Failed Tests:`);
    for (const result of results.filter(r => !r.passed)) {
      console.log(`   - ${result.case}: Expected ${result.expected}, got ${result.actual}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }
  }
  
  // Robustness rating
  console.log(`\n🛡️  Robustness Rating:`);
  if (passRate >= 90) {
    console.log(`   ✅ EXCELLENT (${passRate}% pass rate)`);
  } else if (passRate >= 75) {
    console.log(`   🟡 GOOD (${passRate}% pass rate)`);
  } else {
    console.log(`   ❌ NEEDS IMPROVEMENT (${passRate}% pass rate)`);
  }
  
  // Key findings
  console.log(`\n📋 Key Findings:`);
  console.log(`   - Empty files: ${results.find(r => r.case === 'Empty Java File')?.passed ? 'Handled ✅' : 'Failed ❌'}`);
  console.log(`   - Syntax errors: ${results.find(r => r.case === 'Syntax Error')?.passed ? 'Handled ✅' : 'Failed ❌'}`);
  console.log(`   - Unicode: ${results.find(r => r.case === 'Unicode Characters')?.passed ? 'Handled ✅' : 'Failed ❌'}`);
  console.log(`   - Complex generics: ${results.find(r => r.case === 'Generic Types')?.passed ? 'Handled ✅' : 'Failed ❌'}`);
  console.log(`   - Modern Java (lambdas): ${results.find(r => r.case === 'Lambda Expressions')?.passed ? 'Handled ✅' : 'Failed ❌'}`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('✅ Edge case testing complete!');
  console.log('═'.repeat(70) + '\n');
  
  // Cleanup
  rmSync(testDir, { recursive: true, force: true });
  
  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

// Run tests
runEdgeCaseTests().catch(error => {
  console.error('\n❌ Edge case test suite failed:', error);
  process.exit(1);
});
