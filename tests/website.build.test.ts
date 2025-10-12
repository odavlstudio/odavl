import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { describe, test, beforeAll, expect } from 'vitest'

describe('ODAVL Website Build Tests', () => {
  const websiteDir = path.join(process.cwd(), 'odavl-website')
  
  beforeAll(() => {
    console.log('🌐 Starting Website Build Test Suite')
    if (!fs.existsSync(websiteDir)) {
      throw new Error('odavl-website directory not found')
    }
  })

  describe('Next.js Build Validation', () => {
    test('should have valid package.json configuration', () => {
      const packagePath = path.join(websiteDir, 'package.json')
      expect(fs.existsSync(packagePath)).toBe(true)
      
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      expect(packageData.scripts).toHaveProperty('build')
      expect(packageData.scripts).toHaveProperty('dev')
      expect(packageData.dependencies).toHaveProperty('next')
      expect(packageData.dependencies).toHaveProperty('react')
    })

    test('should build successfully without errors', () => {
      const buildCommand = 'npm run build'
      let buildOutput
      
      try {
        buildOutput = execSync(buildCommand, { 
          cwd: websiteDir,
          encoding: 'utf8',
          stdio: 'pipe'
        })
      } catch (error: unknown) {
        console.error('Build failed:', error)
        throw error
      }
      
      expect(buildOutput).toContain('Compiled successfully')
      expect(buildOutput).not.toContain('Failed to compile')
    })

    test('should generate static export', () => {
      const outDir = path.join(websiteDir, 'out')
      expect(fs.existsSync(outDir)).toBe(true)
      
      const indexFile = path.join(outDir, 'index.html')
      expect(fs.existsSync(indexFile)).toBe(true)
    })
  })

  describe('Internationalization (i18n) Tests', () => {
    test('should have i18n configuration', () => {
      const nextConfigPath = path.join(websiteDir, 'next.config.js')
      expect(fs.existsSync(nextConfigPath)).toBe(true)
      
      const configContent = fs.readFileSync(nextConfigPath, 'utf8')
      expect(configContent).toContain('i18n')
    })

    test('should support 9 languages', () => {
      const localesDir = path.join(websiteDir, 'public', 'locales')
      if (fs.existsSync(localesDir)) {
        const locales = fs.readdirSync(localesDir)
        expect(locales.length).toBeGreaterThanOrEqual(9)
      }
    })
  })

  describe('SEO and Performance', () => {
    test('should have proper meta tags', () => {
      const outDir = path.join(websiteDir, 'out')
      const indexFile = path.join(outDir, 'index.html')
      
      if (fs.existsSync(indexFile)) {
        const content = fs.readFileSync(indexFile, 'utf8')
        expect(content).toContain('<title>')
        expect(content).toContain('meta name="description"')
      }
    })

    test('should generate sitemap', () => {
      const sitemapPath = path.join(websiteDir, 'out', 'sitemap.xml')
      // Sitemap generation is optional but recommended
      if (fs.existsSync(sitemapPath)) {
        const sitemap = fs.readFileSync(sitemapPath, 'utf8')
        expect(sitemap).toContain('<urlset')
      }
    })
  })
})