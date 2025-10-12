import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('VS Code Extension Smoke Tests', () => {
  it('should have valid extension manifest', () => {
    const packagePath = resolve('apps/vscode-ext/package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    
    expect(pkg.name).toBe('odavl')
    expect(pkg.displayName).toBe('ODAVL Studio')
    expect(pkg.engines.vscode).toBeDefined()
    expect(pkg.contributes).toBeDefined()
  })

  it('should have ODAVL control command configured', () => {
    const packagePath = resolve('apps/vscode-ext/package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    
    const commands = pkg.contributes?.commands || []
    const controlCommand = commands.find((cmd: { command: string }) => cmd.command === 'odavl.control')
    
    expect(controlCommand).toBeDefined()
    expect(controlCommand.title).toBe('ODAVL: Show Control Panel')
  })
})