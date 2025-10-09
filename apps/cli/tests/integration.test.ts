import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('ODAVL CLI Integration Tests', () => {
  const ROOT = process.cwd()
  
  it('should have valid CLI source code structure', () => {
    const cliPath = path.join(ROOT, 'apps/cli/src/index.ts')
    expect(fs.existsSync(cliPath)).toBe(true)
    
    const content = fs.readFileSync(cliPath, 'utf8')
    expect(content).toContain('function observe()')
    expect(content).toContain('function decide(')
    expect(content).toContain('function act(')
    expect(content).toContain('function verify(')
    expect(content).toContain('function learn(')
  })

  it('should validate CLI command mapping exists', () => {
    const cliPath = path.join(ROOT, 'apps/cli/src/index.ts')
    const content = fs.readFileSync(cliPath, 'utf8')
    
    expect(content).toContain('cmd === "observe"')
    expect(content).toContain('cmd === "decide"')
    expect(content).toContain('cmd === "act"')
    expect(content).toContain('cmd === "verify"')
    expect(content).toContain('cmd === "run"')
    expect(content).toContain('cmd === "undo"')
  })

  it('should validate ODAVL history exists after runs', () => {
    const historyPath = path.join(ROOT, '.odavl', 'history.json')
    expect(fs.existsSync(historyPath)).toBe(true)
    
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
    expect(Array.isArray(history)).toBe(true)
    expect(history.length).toBeGreaterThan(0)
    
    // Validate history structure
    const lastRun = history[history.length - 1]
    expect(lastRun).toHaveProperty('ts')
    expect(lastRun).toHaveProperty('decision')
    expect(lastRun).toHaveProperty('deltas')
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
    expect(fs.existsSync(gatesPath)).toBe(true)
    
    // Validate gates file is readable and contains expected structure
    const gatesContent = fs.readFileSync(gatesPath, 'utf8')
    expect(gatesContent).toContain('eslint')
    expect(gatesContent).toContain('typeErrors')
    expect(gatesContent).toContain('deltaMax')
  })

  it('should validate policy configuration', () => {
    const policyPath = path.join(ROOT, '.odavl', 'policy.yml') 
    expect(fs.existsSync(policyPath)).toBe(true)
    
    const policyContent = fs.readFileSync(policyPath, 'utf8')
    expect(policyContent).toContain('autonomy')
    expect(policyContent).toContain('riskBudget')
    expect(policyContent).toContain('maxLinesPerPatch')
  })
})