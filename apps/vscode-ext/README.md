# ODAVL Doctor VS Code Extension

This extension provides a live monitoring panel for ODAVL (Observe-Decide-Act-Verify-Learn) autonomous code quality cycles.

## Features

- **Live Cycle Monitoring**: Watch ODAVL cycles in real-time with color-coded phase indicators
- **Interactive Panel**: Click to run ODAVL cycles and view detailed logs
- **Structured Output**: Parse and display machine-readable ODAVL logs

## Usage

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run command: `Open ODAVL Doctor Panel`
3. Click "Run ODAVL Cycle" to start monitoring
4. View live updates as ODAVL processes your code

## Requirements

- VS Code 1.74.0 or higher
- ODAVL project with CLI configured
- Node.js and npm/pnpm installed

## Development

```bash
npm install
npm run compile
```