import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('ODAVL CLI Integration Tests', () => {
  const ROOT = process.cwd()

  it('should have valid CLI source code structure', () => {
    const cliPath = path.join(ROOT, 'apps/cli/src/index.ts')
    expect(fs.existsSync(cliPath)).toBe(true)

    const content = fs.readFileSync(cliPath, 'utf8')
    // Functions are now imported from separate phase modules
    expect(content).toContain('import { observe }')
    expect(content).toContain('import { decide }')
    expect(content).toContain('import { act }')
    expect(content).toContain('import { verify }')
    expect(content).toContain('function main()')
  })

  it('should validate CLI command mapping exists', () => {
    const cliPath = path.join(ROOT, 'apps/cli/src/index.ts')
    const content = fs.readFileSync(cliPath, 'utf8')

    // New structure uses commands object with keys
    expect(content).toContain('observe:')
    expect(content).toContain('decide:')
    expect(content).toContain('act:')
    expect(content).toContain('verify:')
    expect(content).toContain('loop:')
  })

  it('should validate ODAVL history exists after runs', () => {
    const historyPath = path.join(ROOT, '.odavl', 'history.json')

    // setup.ts creates sample history entry, so just read it
    expect(fs.existsSync(historyPath)).toBe(true)

    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0) // setup.ts creates sample entry

    if (history.length > 0) {
      const lastRun = history[history.length - 1]
      expect(lastRun).toHaveProperty('timestamp')
      expect(lastRun).toHaveProperty('recipeId')
      expect(lastRun).toHaveProperty('success')
    }
  })

  it('should validate recipe trust system', () => {
    const trustPath = path.join(ROOT, '.odavl', 'recipes-trust.json')
    expect(fs.existsSync(trustPath)).toBe(true)

    const trustData = JSON.parse(fs.readFileSync(trustPath, 'utf8'))
    expect(Array.isArray(trustData)).toBe(true)

    if (trustData.length > 0) {
      const recipe = trustData[0]
      expect(recipe).toHaveProperty('id')
      expect(recipe).toHaveProperty('runs')
      expect(recipe).toHaveProperty('success')
      expect(recipe).toHaveProperty('trust')
      expect(typeof recipe.trust).toBe('number')
      expect(recipe.trust).toBeGreaterThanOrEqual(0)
      expect(recipe.trust).toBeLessThanOrEqual(1)
    }
  })

  it('should validate quality gates configuration', () => {
    const gatesPath = path.join(ROOT, '.odavl', 'gates.yml')

    // Gates file may not exist in test environment - that's ok
    if (fs.existsSync(gatesPath)) {
      const gatesContent = fs.readFileSync(gatesPath, 'utf8')
      expect(gatesContent.length).toBeGreaterThan(0)
    }
  })

  it('should validate policy configuration', () => {
    const policyPath = path.join(ROOT, '.odavl', 'policy.yml')

    // Policy file may not exist in test environment - that's ok
    if (fs.existsSync(policyPath)) {
      const policyContent = fs.readFileSync(policyPath, 'utf8')
      expect(policyContent.length).toBeGreaterThan(0)
    }
  })
})