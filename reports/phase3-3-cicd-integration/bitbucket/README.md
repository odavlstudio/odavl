# Bitbucket Pipelines - ODAVL Insight Integration

## Description

Bitbucket Pipelines integration for ODAVL Insight

## Features

- Pipe-based integration
- Pull request comments
- Quality gate enforcement
- Build artifacts
- Cache detection results
- Deployment gates
- Slack notifications
- Jira integration

## Setup (simple - 5 minutes)

1. Add pipe to bitbucket-pipelines.yml
2. Configure ODAVL_TOKEN secret
3. Configure quality gates
4. Push to trigger pipeline
5. Review results in PR

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

- `pipe/pipe.yml` - Pipe metadata
- `pipe/pipe.sh` - Pipe implementation
- `pipe/quality-gates.sh` - Quality gates
- `README.md` - Documentation
- `examples/bitbucket-pipelines-basic.yml` - Basic example
- `examples/bitbucket-pipelines-advanced.yml` - Advanced example

## Documentation

For more information, see the [ODAVL Insight Documentation](https://docs.odavl.studio/insight).
