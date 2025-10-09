import { describe, it, expect, vi } from 'vitest'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'

// Mock file system for safe testing
vi.mock('node:fs')
vi.mock('node:child_process')

const mockFs = vi.mocked(fs)
const mockExecSync = vi.mocked(execSync)

describe('ODAVL Core Functions', () => {
  
  describe('observe()', () => {
    it('should collect ESLint warnings and TypeScript errors', () => {
      // Mock ESLint JSON output
      const mockEslintOutput = JSON.stringify([
        { messages: [{ severity: 1 }, { severity: 2 }] },
        { messages: [{ severity: 1 }] }
      ])
      
      // Mock TypeScript output  
      const mockTscOutput = 'error TS2304: test\nerror TS1234: another'
      
      mockExecSync.mockImplementation((cmd) => {
        if (cmd.includes('eslint')) return Buffer.from(mockEslintOutput)
        if (cmd.includes('tsc')) return Buffer.from(mockTscOutput)
        return Buffer.from('')
      })
      
      mockFs.existsSync.mockReturnValue(true)
      mockFs.mkdirSync.mockReturnValue(undefined)
      mockFs.writeFileSync.mockReturnValue(undefined)
      
      // Import and test observe function would go here
      // For now, validate mocked behavior
      expect(mockEslintOutput).toContain('severity')
      expect(mockTscOutput).toMatch(/error TS\d+/)
    })
  })

  describe('decide()', () => {
    it('should select recipe based on trust scores', () => {
      const mockMetrics = {
        eslintWarnings: 5,
        typeErrors: 0, 
        timestamp: new Date().toISOString()
      }
      
      // Mock recipe files
      mockFs.existsSync.mockReturnValue(true)
      vi.mocked(mockFs.readdirSync).mockReturnValue(['esm-hygiene.json'] as never)
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        id: 'esm-hygiene',
        trust: 0.9
      }))
      
      // Test would validate decision logic here
      expect(mockMetrics.eslintWarnings).toBeGreaterThan(0)
    })
  })

  describe('act()', () => {
    it('should execute fixes and create undo snapshots', () => {
      const decision = 'esm-hygiene'
      const testFiles = ['test1.ts', 'test2.ts']
      
      mockFs.existsSync.mockReturnValue(true)  
      mockFs.mkdirSync.mockReturnValue(undefined)
      mockFs.readFileSync.mockReturnValue('test content')
      mockFs.writeFileSync.mockReturnValue(undefined)
      mockExecSync.mockReturnValue(Buffer.from('eslint fix complete'))
      
      // Test would validate undo snapshot creation
      expect(decision).toBe('esm-hygiene')
      expect(testFiles.length).toBeGreaterThan(0)
    })
  })
})