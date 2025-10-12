import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

describe('ODAVL Integration Tests', () => {
  const projectRoot = process.cwd()
  const evidenceDir = path.join(projectRoot, 'evidence')

  beforeAll(() => {
    console.log('🔍 Starting ODAVL Integration Test Suite')
  })

  afterAll(() => {
    console.log('✅ ODAVL Integration Tests Complete')
  })

  describe('Full ODAVL Cycle', () => {
    it('should execute observe phase and generate metrics', () => {
      const result = execSync('pnpm odavl:observe', { 
        encoding: 'utf8',
        cwd: projectRoot 
      })
      
      const metrics = JSON.parse(result.trim())
      expect(metrics).toHaveProperty('eslintWarnings')
      expect(metrics).toHaveProperty('typeErrors')
      expect(metrics).toHaveProperty('timestamp')
      expect(typeof metrics.eslintWarnings).toBe('number')
      expect(typeof metrics.typeErrors).toBe('number')
    })

    it('should execute decide phase with trust scoring', () => {
      const result = execSync('pnpm tsx apps/cli/src/index.ts decide', { 
        encoding: 'utf8',
        cwd: projectRoot 
      })
      
      const decision = JSON.parse(result.trim())
      expect(decision).toHaveProperty('action')
      expect(decision).toHaveProperty('confidence')
      expect(['noop', 'remove-unused', 'fix-types']).toContain(decision.action)
    })

    it('should validate safety gates configuration', () => {
      const gatesPath = path.join(projectRoot, '.odavl', 'gates.yml')
      expect(existsSync(gatesPath)).toBe(true)
      
      const gatesContent = readFileSync(gatesPath, 'utf8')
      expect(gatesContent).toContain('deltaMax: 0')
      expect(gatesContent).toContain('eslintWarnings')
      expect(gatesContent).toContain('typeErrors')
    })

    it('should validate risk policy constraints', () => {
      const policyPath = path.join(projectRoot, '.odavl', 'policy.yml')
      expect(existsSync(policyPath)).toBe(true)
      
      const policyContent = readFileSync(policyPath, 'utf8')
      expect(policyContent).toContain('maxFilesTouched: 10')
      expect(policyContent).toContain('maxLinesPerFile: 40')
    })
  })

  describe('Evidence System', () => {
    it('should generate evidence files during operations', () => {
      expect(existsSync(evidenceDir)).toBe(true)
      const evidenceFiles = execSync('powershell -c "(Get-ChildItem evidence/).Count"', { 
        encoding: 'utf8',
        cwd: projectRoot 
      })
      expect(parseInt(evidenceFiles.trim())).toBeGreaterThan(0)
    })

    it('should validate evidence retention system', () => {
      const retentionPath = path.join(projectRoot, '.odavl', 'retention.yml')
      expect(existsSync(retentionPath)).toBe(true)
      
      const result = execSync('pnpm odavl:cleanup -DryRun -Json', { 
        encoding: 'utf8',
        cwd: projectRoot 
      })
      
      const cleanupResults = JSON.parse(result.trim())
      expect(cleanupResults).toHaveProperty('totalFiles')
      expect(cleanupResults).toHaveProperty('eligibleFiles')
      expect(cleanupResults.totalFiles).toBeGreaterThan(0)
    })
  })
})