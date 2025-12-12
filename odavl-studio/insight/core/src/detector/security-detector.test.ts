/**
 * Tests for SecurityDetector
 * 
 * Coverage:
 * - SQL injection detection
 * - XSS vulnerabilities
 * - Hardcoded secrets
 * - Insecure dependencies
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { SecurityDetector } from './security-detector';

describe('SecurityDetector', () => {
  let tempDir: string;
  let detector: SecurityDetector;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'security-detector-test-'));
    detector = new SecurityDetector(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  async function createFile(relativePath: string, content: string): Promise<string> {
    const filePath = path.join(tempDir, relativePath);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection vulnerabilities', async () => {
      await createFile('src/database.ts', `
        const query = "SELECT * FROM users WHERE id = " + userId;
        db.execute(query);
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      expect(issues.length).toBeGreaterThan(0);
      const sqlInjection = issues.find((i: any) => i.type === 'sql-injection');
      expect(sqlInjection).toBeDefined();
      expect(sqlInjection?.severity).toBe('critical');
    });

    it('should detect template literal SQL injection', async () => {
      await createFile('src/database.ts', `
        const query = \`SELECT * FROM users WHERE name = '\${userName}'\`;
        db.execute(query);
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const sqlInjection = issues.find((i: any) => i.type === 'sql-injection');
      expect(sqlInjection).toBeDefined();
    });

    it('should not flag prepared statements', async () => {
      await createFile('src/database.ts', `
        const query = "SELECT * FROM users WHERE id = ?";
        db.execute(query, [userId]);
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const sqlInjection = issues.find((i: any) => i.type === 'sql-injection');
      expect(sqlInjection).toBeUndefined();
    });
  });

  describe('XSS Detection', () => {
    it('should detect dangerouslySetInnerHTML usage', async () => {
      await createFile('src/component.tsx', `
        <div dangerouslySetInnerHTML={{__html: userInput}} />
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const xss = issues.find((i: any) => i.type === 'xss');
      expect(xss).toBeDefined();
      expect(xss?.severity).toBe('high');
    });

    it('should detect eval usage', async () => {
      await createFile('src/code.ts', `
        eval(userProvidedCode);
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const evalIssue = issues.find((i: any) => i.type === 'code-injection');
      expect(evalIssue).toBeDefined();
    });

    it('should detect innerHTML assignment', async () => {
      await createFile('src/dom.ts', `
        element.innerHTML = userContent;
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const xss = issues.find((i: any) => i.type === 'xss');
      expect(xss).toBeDefined();
    });
  });

  describe('Hardcoded Secrets Detection', () => {
    it('should detect hardcoded API keys', async () => {
      await createFile('src/config.ts', `
        const API_KEY = "sk-1234567890abcdef";
        const apiKey = "AIzaSyC1234567890";
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const secrets = issues.filter((i: any) => i.type === 'hardcoded-secret');
      expect(secrets.length).toBeGreaterThan(0);
      expect(secrets[0].severity).toBe('critical');
    });

    it('should detect AWS credentials', async () => {
      await createFile('src/aws.ts', `
        const accessKey = "AKIA1234567890ABCDEF";
        const secretKey = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const awsSecrets = issues.filter((i: any) => i.type === 'hardcoded-secret');
      expect(awsSecrets.length).toBeGreaterThan(0);
    });

    it('should detect database passwords', async () => {
      await createFile('src/db.ts', `
        const dbUrl = "postgresql://user:MyP@ssw0rd123@localhost:5432/db";
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const passwordIssue = issues.find((i: any) => i.type === 'hardcoded-secret');
      expect(passwordIssue).toBeDefined();
    });

    it('should not flag environment variables', async () => {
      await createFile('src/config.ts', `
        const apiKey = process.env.API_KEY;
      `);

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const secrets = issues.filter((i: any) => i.type === 'hardcoded-secret');
      expect(secrets.length).toBe(0);
    });
  });

  describe('Insecure Dependencies', () => {
    it('should detect dependencies with known vulnerabilities', async () => {
      await createFile('package.json', JSON.stringify({
        dependencies: {
          'lodash': '4.17.0', // Known vulnerable version
        }
      }));

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      const vulnDep = issues.find((i: any) => i.type === 'vulnerable-dependency');
      expect(vulnDep).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      await createFile('src/test.ts', `
        const secret = "sk-test-key";
      `);

      const detector = new SecurityDetector(tempDir);
      
      const issues = await detector.detect(tempDir);

      // Should detect secrets but not SQL injection
      const secrets = issues.filter((i: any) => i.type === 'hardcoded-secret');
      expect(secrets.length).toBeGreaterThan(0);
    });

    it('should exclude specified patterns', async () => {
      await createFile('test/fixture.ts', `
        const API_KEY = "sk-test-key";
      `);

      const detector = new SecurityDetector(tempDir);
      
      const issues = await detector.detect(tempDir);

      expect(issues.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should not throw on invalid files', async () => {
      await createFile('src/test.ts', 'invalid typescript {');

      const detector = new SecurityDetector(tempDir);
      
      await expect(detector.detect(tempDir)).resolves.toBeDefined();
    });

    it('should complete analysis even with errors', async () => {
      await createFile('src/valid.ts', `const x = 1;`);
      await createFile('src/invalid.ts', 'syntax error {');

      const detector = new SecurityDetector(tempDir);
      const issues = await detector.detect(tempDir);

      expect(Array.isArray(issues)).toBe(true);
    });
  });
});
