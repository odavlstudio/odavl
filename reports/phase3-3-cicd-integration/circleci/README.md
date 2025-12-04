# CircleCI Orb - ODAVL Insight Integration

## Description

Official CircleCI orb for ODAVL Insight

## Features

- One-line job setup
- Orb parameters
- Quality gate enforcement
- Artifact storage
- Cache detection results
- Parallelism support
- Slack notifications
- GitHub integration

## Setup (simple - 4 minutes)

1. Import orb in .circleci/config.yml
2. Add odavl-insight/analyze job
3. Configure ODAVL_TOKEN
4. Configure quality gates
5. Push to trigger workflow
6. Review results in CircleCI

## Performance

- **Detection Time:** <2min
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

- `src/@orb.yml` - Orb metadata
- `src/jobs/analyze.yml` - Analyze job
- `src/commands/install.yml` - Install command
- `src/commands/run.yml` - Run command
- `README.md` - Documentation
- `examples/basic.yml` - Basic example
- `examples/advanced.yml` - Advanced example

## Documentation

For more information, see the [ODAVL Insight Documentation](https://docs.odavl.studio/insight).
