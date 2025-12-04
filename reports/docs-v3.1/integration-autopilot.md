# 🤖 Autopilot Integration Guide

Connect ODAVL Insight with Autopilot for automated issue fixing.

## Overview

Export detected issues to Autopilot with one click, and let it auto-fix them while you focus on new features.

## Setup (2 Minutes)

### 1. Install Both Products

```bash
# Install Insight
npm install -g @odavl-studio/cli

# Install Autopilot
npm install -g @odavl-studio/autopilot
```

### 2. Configure Connection

```yaml
# .odavl/config.yml
autopilot:
  enabled: true
  autoExport: true
  maxIssuesPerBatch: 10
```

### 3. First Export

```bash
# Detect issues
odavl insight analyze

# Export to Autopilot
odavl insight export --to autopilot

# Or use one command
odavl insight analyze --export-to-autopilot
```

## Usage

### CLI Export

```bash
# Export all issues
odavl insight export --to autopilot

# Export specific languages
odavl insight export --to autopilot --language typescript,python

# Export with filters
odavl insight export --to autopilot --severity critical,high
```

### Dashboard Export

1. Open Cloud Dashboard
2. Select issues to fix
3. Click "Export to Autopilot"
4. Review in Autopilot dashboard
5. Approve & run fixes

### VS Code Extension

1. Open VS Code
2. View detected issues in Problems Panel
3. Right-click issue → "Fix with Autopilot"
4. Extension sends to Autopilot
5. Auto-fix applied with undo snapshot

## Workflow

```
Insight Detects → Review Issues → Export to Autopilot → Auto-Fix → Verify → Deploy
```

## Advanced

### Custom Export Format

```typescript
// Export with custom metadata
await insight.export({
  to: 'autopilot',
  format: 'odavl-v3',
  metadata: {
    project: 'my-app',
    priority: 'high',
    assignee: 'autopilot'
  }
});
```

### Batch Processing

```bash
# Export in batches of 5
odavl insight export --to autopilot --batch-size 5
```

## Best Practices

✅ Review issues before export  
✅ Start with low-severity issues  
✅ Use undo snapshots  
✅ Test fixes before deployment  
✅ Monitor Autopilot trust scores  

## Troubleshooting

**Issue**: Export fails

**Solution**: Check Autopilot connection in `.odavl/config.yml`

---

**Next**: [CI/CD Integration](./integration-cicd.md)
