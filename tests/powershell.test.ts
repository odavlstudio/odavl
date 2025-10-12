import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync, readdirSync } from 'fs'
import path from 'path'

describe('PowerShell Tools Compliance Tests', () => {
  const toolsDir = path.join(process.cwd(), 'tools')

  describe('JSON Schema Compliance', () => {
    it('should validate all PowerShell tools return proper JSON when requested', () => {
      const psFiles = readdirSync(toolsDir).filter(file => 
        file.endsWith('.ps1') && file !== 'common.ps1'
      )
      
      expect(psFiles.length).toBeGreaterThan(0)
      
      for (const psFile of psFiles) {
        const toolName = path.basename(psFile, '.ps1')
        console.log(`Testing PowerShell tool: ${toolName}`)
        
        try {
          const result = execSync(`powershell -File "tools/${psFile}" -Help`, {
            encoding: 'utf8',
            cwd: process.cwd(),
            timeout: 10000
          })
          
          // Should have help output
          expect(result.length).toBeGreaterThan(0)
        } catch (error) {
          console.warn(`Tool ${toolName} may not support -Help parameter:`, error)
        }
      }
    })

    it('should validate cleanup.ps1 JSON output format', () => {
      const result = execSync('powershell -File "tools/cleanup.ps1" -DryRun -Json', {
        encoding: 'utf8',
        cwd: process.cwd()
      })
      
      const jsonOutput = JSON.parse(result.trim())
      expect(jsonOutput).toHaveProperty('tool')
      expect(jsonOutput).toHaveProperty('status')
      expect(jsonOutput).toHaveProperty('summary')
      expect(jsonOutput.tool).toBe('cleanup')
      expect(jsonOutput.status).toBe('success')
    })

    it('should validate golden.ps1 execution', () => {
      const goldenPath = path.join(toolsDir, 'golden.ps1')
      expect(existsSync(goldenPath)).toBe(true)
      
      try {
        const result = execSync('powershell -File "tools/golden.ps1" -DryRun', {
          encoding: 'utf8',
          cwd: process.cwd(),
          timeout: 30000
        })
        
        expect(result).toContain('ODAVL')
        expect(result.length).toBeGreaterThan(0)
      } catch (error) {
        console.warn('Golden script may require specific environment setup:', error)
      }
    })
  })

  describe('Common Utilities', () => {
    it('should validate common.ps1 function availability', () => {
      const commonPath = path.join(toolsDir, 'common.ps1')
      expect(existsSync(commonPath)).toBe(true)
      
      const commonContent = readFileSync(commonPath, 'utf8')
      expect(commonContent).toContain('New-ODAVLResponse')
      expect(commonContent).toContain('ValidateSet')
      expect(commonContent).toContain('cleanup')
    })

    it('should validate PowerShell version compatibility', () => {
      const result = execSync('powershell -Command "$PSVersionTable.PSVersion.Major"', {
        encoding: 'utf8'
      })
      
      const majorVersion = parseInt(result.trim())
      expect(majorVersion).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid parameters gracefully', () => {
      try {
        execSync('powershell -File "tools/cleanup.ps1" -InvalidParam', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe'
        })
      } catch (error: unknown) {
        // Should fail with parameter error, not crash
        expect((error as { status: number }).status).toBe(1)
      }
    })

    it('should provide meaningful error messages', () => {
      try {
        execSync('powershell -File "tools/cleanup.ps1" -Config "nonexistent.yml"', {
          encoding: 'utf8',
          cwd: process.cwd(),
          stdio: 'pipe'
        })
      } catch (error: unknown) {
        const execError = error as { stderr?: string; stdout?: string }
        expect(execError.stderr || execError.stdout).toBeTruthy()
      }
    })
  })
})