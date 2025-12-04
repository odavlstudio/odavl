# Azure DevOps Extension - ODAVL Insight Integration

## Description

Official Azure DevOps marketplace extension

## Features

- Pipeline task integration
- Pull request comments
- Quality gate enforcement
- Work item linking
- Build artifacts
- Dashboard widgets
- Email notifications
- Teams integration

## Setup (simple - 5 minutes)

1. Install extension from marketplace
2. Add ODAVL Insight task to pipeline
3. Configure service connection
4. Configure quality gates
5. Run pipeline
6. Review results in PR

## Performance

- **Detection Time:** <2.5min
- **Caching:** Yes
- **Parallel Execution:** Yes

## Quality Gates


**Thresholds:**
- Error Rate: 5%
- Complexity: 10
- Coverage: 80%
- Security: critical, high

**Actions:**
- Block PR: Yes
- Fail Build: Yes
- Notify: Yes


## Files

- `vss-extension.json` - Extension manifest
- `task/task.json` - Task definition
- `task/index.ts` - Task implementation
- `task/quality-gates.ts` - Quality gates
- `README.md` - Documentation
- `examples/azure-pipelines-basic.yml` - Basic example
- `examples/azure-pipelines-advanced.yml` - Advanced example

## Documentation

For more information, see the [ODAVL Insight Documentation](https://docs.odavl.studio/insight).
