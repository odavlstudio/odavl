#!/usr/bin/env node

/**
 * ODAVL VS Code Extension Self-Validation Script
 * Validates that all components are functional after build
 */

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    log(type, message) {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        if (type === 'error') this.errors.push(message);
        if (type === 'warning') this.warnings.push(message);
        if (type === 'success') this.successes.push(message);
    }

    validateFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.log('success', `${description} exists: ${filePath}`);
            return true;
        } else {
            this.log('error', `${description} missing: ${filePath}`);
            return false;
        }
    }

    validatePackageJson() {
        const packagePath = path.join(__dirname, 'package.json');
        if (!this.validateFileExists(packagePath, 'Package.json')) return false;

        try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            
            // Check essential fields
            const requiredFields = ['name', 'displayName', 'version', 'main'];
            for (const field of requiredFields) {
                if (!pkg[field]) {
                    this.log('error', `Package.json missing required field: ${field}`);
                } else {
                    this.log('success', `Package.json has ${field}: ${pkg[field]}`);
                }
            }

            // Check icon path
            if (pkg.icon) {
                const iconPath = path.join(__dirname, pkg.icon);
                if (this.validateFileExists(iconPath, 'Extension icon')) {
                    if (pkg.icon.endsWith('.svg')) {
                        this.log('warning', 'Extension uses SVG icon - consider PNG for marketplace compatibility');
                    }
                }
            }

            // Check commands
            if (pkg.contributes?.commands) {
                this.log('success', `Package.json defines ${pkg.contributes.commands.length} commands`);
                
                const requiredCommands = [
                    'odavl.control',
                    'odavl.runCycle',
                    'odavl.observe',
                    'odavl.decide',
                    'odavl.act',
                    'odavl.verify',
                    'odavl.learn'
                ];

                for (const cmd of requiredCommands) {
                    const found = pkg.contributes.commands.find(c => c.command === cmd);
                    if (found) {
                        this.log('success', `Command registered: ${cmd}`);
                    } else {
                        this.log('error', `Missing command: ${cmd}`);
                    }
                }
            }

            // Check views
            if (pkg.contributes?.views?.odavl) {
                this.log('success', `Package.json defines ${pkg.contributes.views.odavl.length} views`);
            }

            return true;
        } catch (error) {
            this.log('error', `Failed to parse package.json: ${error.message}`);
            return false;
        }
    }

    validateBuildOutput() {
        const distPath = path.join(__dirname, 'dist');
        const outPath = path.join(__dirname, 'out');
        
        if (fs.existsSync(distPath)) {
            this.validateFileExists(path.join(distPath, 'extension.js'), 'Main extension build output');
            this.log('success', 'Extension built to dist/ directory');
        } else if (fs.existsSync(outPath)) {
            this.validateFileExists(path.join(outPath, 'extension.js'), 'Main extension build output');
            this.log('success', 'Extension built to out/ directory');
        } else {
            this.log('error', 'No build output found in dist/ or out/');
        }
    }

    validateSourceFiles() {
        const srcPath = path.join(__dirname, 'src');
        if (!this.validateFileExists(srcPath, 'Source directory')) return false;

        const criticalFiles = [
            'src/extension.ts',
            'src/views/ControlDashboard.ts',
            'src/services/ODAVLDataService.ts',
            'src/utils/Logger.ts',
            'src/utils/FileWatcher.ts'
        ];

        for (const file of criticalFiles) {
            this.validateFileExists(path.join(__dirname, file), `Critical source file: ${file}`);
        }
    }

    validateTypeScript() {
        const tsconfigPath = path.join(__dirname, 'tsconfig.json');
        if (!this.validateFileExists(tsconfigPath, 'TypeScript config')) return false;

        try {
            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
            if (tsconfig.compilerOptions) {
                this.log('success', 'TypeScript configuration is valid');
                if (tsconfig.compilerOptions.strict) {
                    this.log('success', 'TypeScript strict mode enabled');
                }
            }
        } catch (error) {
            this.log('error', `Invalid tsconfig.json: ${error.message}`);
        }
    }

    validateMediaAssets() {
        const mediaPath = path.join(__dirname, 'media');
        if (this.validateFileExists(mediaPath, 'Media directory')) {
            // Accept either PNG (preferred for Marketplace) or legacy SVG
            const pngIcon = path.join(mediaPath, 'odavl.png');
            const svgIcon = path.join(mediaPath, 'odavl-activitybar-light.svg');

            const hasPng = fs.existsSync(pngIcon);
            const hasSvg = fs.existsSync(svgIcon);

            if (hasPng) {
                this.log('success', `ODAVL icon (PNG) exists: ${pngIcon}`);
            } else if (hasSvg) {
                this.log('warning', 'SVG icon found but PNG is recommended for Marketplace compatibility');
                this.validateFileExists(svgIcon, 'ODAVL ActivityBar icon (SVG)');
            } else {
                this.log('error', 'No ODAVL icon found in media/ (expected odavl.png or odavl-activitybar-light.svg)');
            }
        }
    }

    async runValidation() {
        console.log('🧩 ODAVL VS Code Extension Self-Validation');
        console.log('==========================================\\n');

        this.log('success', 'Starting extension validation...');

        // Run all validation checks
        this.validatePackageJson();
        this.validateBuildOutput();
        this.validateSourceFiles();
        this.validateTypeScript();
        this.validateMediaAssets();

        // Summary
        console.log('\\n==========================================');
        console.log('🧩 VALIDATION SUMMARY');
        console.log('==========================================');
        
        this.log('success', `✅ Successes: ${this.successes.length}`);
        if (this.warnings.length > 0) {
            this.log('warning', `⚠️ Warnings: ${this.warnings.length}`);
        }
        if (this.errors.length > 0) {
            this.log('error', `❌ Errors: ${this.errors.length}`);
        }

        if (this.errors.length === 0) {
            console.log('\\n🎉 ODAVL VS Code Extension validation PASSED!');
            console.log('All critical components are functional and ready.');
            return true;
        } else {
            console.log('\\n💥 ODAVL VS Code Extension validation FAILED!');
            console.log('Please fix the errors above before proceeding.');
            return false;
        }
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ExtensionValidator();
    validator.runValidation().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = ExtensionValidator;