import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('ODAVL CLI Smoke Tests', () => {
  it('should have valid CLI entry point', () => {
    const cliPath = resolve('apps/cli/src/index.ts')
    const content = readFileSync(cliPath, 'utf-8')
    
    // Basic smoke test - file exists and has expected structure
    expect(content).toContain('#!/usr/bin/env node')
    expect(content.length).toBeGreaterThan(100)
  })

  it('should have valid package.json configuration', () => {
    const packagePath = resolve('apps/cli/package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    
    expect(pkg.name).toBe('@odavl/cli')
    expect(pkg.bin).toBeDefined()
    expect(pkg.bin.odavl).toBeDefined()
  })
})