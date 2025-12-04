# GitHub Copilot Quick Reference for ODAVL

## 🚀 Most Useful Prompts

### Understanding the Codebase

```text
@workspace Explain how the ODAVL cycle works from observe to learn
@workspace Show me how trust scoring is calculated in decide.ts
@workspace How does the undo system work? Show me the code
@workspace Explain the relationship between CLI and VS Code extension
```

### Adding Features

```text
@workspace I want to add a new recipe for [task]. What's the schema and where do I put it?
@workspace How do I add a new panel to the VS Code extension? Give me the steps
@workspace Show me examples of existing recipes I can use as a template
@workspace How do I add a new quality gate to verify phase?
```

### Debugging & Troubleshooting

```text
@workspace Why isn't the attestation being created after verify phase?
@workspace I have type errors. How can I fix them while staying within governance constraints?
@workspace The ledger isn't auto-opening. What could be wrong?
@workspace Show me where logs are written and how to debug phase execution
```

### Writing Tests

```text
@workspace Write Vitest tests for RiskBudgetGuard.validate() with examples
@workspace How do I mock ESLint output in observe phase tests?
@workspace Show me existing test patterns in the codebase I should follow
@workspace What's the test coverage threshold and how do I check it?
```

### Following Patterns

```text
@workspace How do I safely execute a shell command in ODAVL?
@workspace Show me the correct way to read governance config
@workspace How do I create a ledger entry after a run?
@workspace What's the proper error handling pattern for phase execution?
```

### Governance & Safety

```text
@workspace Does this change respect the RiskBudgetGuard constraints?
@workspace How many files can I modify in one cycle?
@workspace Which paths are protected and can't be auto-edited?
@workspace How do I create an undo snapshot before making changes?
```

## 💡 Power User Tips

### Use Inline Chat for Quick Edits

```text
# While editing a file, press Ctrl+I (Cmd+I on Mac)
/fix this error while respecting governance constraints
/optimize this function without changing behavior
/doc add JSDoc comments following ODAVL patterns
```

### Reference Existing Code

```text
@workspace Find similar implementations of [feature] in the codebase
@workspace Show me how [function/class] is used across the project
@workspace Are there existing examples of [pattern] I can follow?
```

### Multi-Step Workflows

```text
@workspace I need to:
1. Add a new recipe for removing unused imports
2. Test it locally
3. Ensure it respects the 10 file limit
4. Update trust scores appropriately

Guide me through each step with specific commands
```

## 🎯 Project-Specific Shortcuts

### Recipe Development

```text
@workspace Create a recipe to [task] with proper trust initialization
@workspace How do I test a recipe without running the full ODAVL cycle?
@workspace Show me the trust update logic in decide phase
```

### VS Code Extension

```text
@workspace Add a new TreeView provider for [feature]
@workspace How do I register a new command in package.json?
@workspace Show me the file watcher pattern for .odavl/ledger/
```

### Quality & Testing

```text
@workspace Run forensic:all - what does this command check?
@workspace How do I increase test coverage for [file]?
@workspace What are the ESLint rules specific to ODAVL?
```

## 📋 Common Tasks Checklist

### Before Committing Code

- [ ] `@workspace Does my change violate any governance constraints?`
- [ ] `@workspace Are there type errors? Show me how to fix them`
- [ ] `@workspace Do I need to update any documentation?`
- [ ] `@workspace Should I add tests for this change?`

### When Stuck

- [ ] `@workspace Explain this error message in the context of ODAVL`
- [ ] `@workspace Show me the relevant files for [feature]`
- [ ] `@workspace What's the usual pattern for [task]?`
- [ ] `@workspace Give me a step-by-step plan to implement [feature]`

## 🔧 Command Palette Quick Access

| Command | What to Ask Copilot |
|---------|---------------------|
| `/explain` | What does this code do and how does it fit in ODAVL? |
| `/fix` | Fix this while following ODAVL patterns |
| `/tests` | Write Vitest tests following project conventions |
| `/doc` | Add JSDoc comments with ODAVL context |
| `/optimize` | Improve performance without breaking constraints |

## 🎓 Learning Path

### Week 1: Understanding

```text
@workspace Give me an overview of ODAVL architecture
@workspace What are the 5 phases and what does each do?
@workspace Show me the critical data structures in .odavl/
```

### Week 2: Contributing

```text
@workspace How do I run the project locally?
@workspace What's the development workflow?
@workspace Show me examples of recent changes I can learn from
```

### Week 3: Advanced

```text
@workspace How does the ML-based trust learning work?
@workspace Explain the attestation chain and cryptographic proofs
@workspace How do I add custom verification logic?
```

## 🌟 Pro Tips

1. **Always use @workspace** - Gives Copilot full project context
2. **Be specific** - Mention file names, function names, concepts
3. **Ask for examples** - "Show me existing code" beats generic answers
4. **Iterate** - If first answer isn't perfect, refine your question
5. **Verify** - Always review Copilot's suggestions for ODAVL compliance

---

**Remember**: Copilot is trained on `.github/copilot-instructions.md`, so it knows ODAVL patterns!
