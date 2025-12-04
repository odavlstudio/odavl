# Test Projects for Guardian v5.0

This directory contains minimal test projects for validating Guardian's detection and testing capabilities.

## 📁 Structure

```
test-projects/
├── test-website/          # Next.js website
├── test-extension/        # VS Code extension
├── test-cli/             # CLI tool
├── test-package/         # TypeScript library
└── test-monorepo/        # Monorepo with multiple products
```

## 🎯 Purpose

Each test project serves as a validation target for Guardian:

- **Detection Testing**: Verify auto-detection works correctly
- **Tester Validation**: Ensure each specialized tester works
- **Integration Testing**: Test full Guardian workflow
- **Manual Testing**: Quick validation during development

## 🚀 Usage

```bash
# From any test project directory
pnpm guardian

# Expected: Guardian detects project type and shows appropriate menu
```

## 📝 Test Matrix

| Project | Type | Expected Detection | Menu Options |
|---------|------|-------------------|--------------|
| test-website | Next.js | website (90%+) | Test Website, Language |
| test-extension | VS Code | extension (95%+) | Test Extension, Language |
| test-cli | Commander | cli (90%+) | Test CLI, Language |
| test-package | TypeScript | package (85%+) | Test Package, Language |
| test-monorepo | pnpm workspace | monorepo (95%+) | All products listed |

## ⚙️ Setup

Each test project includes:
- `package.json` with proper configuration
- Minimal source files for detection
- README explaining the test case
- Expected Guardian behavior
