# Contributing to Guardian

Thank you for your interest in contributing to Guardian! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [issue tracker](https://github.com/odavl/guardian/issues) to avoid duplicates.

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)
- **Error messages** or stack traces

**Example:**

```markdown
**Bug**: Login fails with valid credentials

**Steps to Reproduce**:
1. Navigate to /login
2. Enter valid email and password
3. Click "Sign In"

**Expected**: User logged in and redirected to dashboard
**Actual**: Error message "Invalid credentials"

**Environment**: 
- OS: Windows 11
- Node: 20.10.0
- Browser: Chrome 120.0.0

**Error**: 
```

TypeError: Cannot read property 'id' of undefined
  at loginHandler (route.ts:45)

```
```

### Suggesting Enhancements

Enhancement suggestions are welcome! Create an issue with:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed feature
- **Use cases** and benefits
- **Mockups or examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Write or update tests** for your changes
4. **Ensure tests pass** and code is properly formatted
5. **Update documentation** if needed
6. **Submit a pull request** with a clear description

## Development Workflow

### 1. Fork and Clone

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/guardian.git
cd guardian
```

### 2. Create a Branch

Use descriptive branch names:

```bash
# Feature branches
git checkout -b feature/add-sso-authentication

# Bug fix branches
git checkout -b bugfix/fix-memory-leak

# Documentation branches
git checkout -b docs/update-api-guide
```

### Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-webhooks` |
| `bugfix/` | Bug fixes | `bugfix/fix-rate-limit` |
| `hotfix/` | Critical production fixes | `hotfix/security-patch` |
| `docs/` | Documentation updates | `docs/add-deployment-guide` |
| `refactor/` | Code refactoring | `refactor/simplify-auth` |
| `test/` | Adding tests | `test/add-integration-tests` |
| `chore/` | Maintenance tasks | `chore/upgrade-dependencies` |

### 3. Make Changes

Follow our [coding standards](#coding-standards) and [best practices](#best-practices).

### 4. Write Tests

All code changes should include appropriate tests:

```typescript
// tests/unit/auth/login.test.ts
import { describe, it, expect } from 'vitest';
import { loginUser } from '@/lib/auth';

describe('loginUser', () => {
  it('should authenticate valid credentials', async () => {
    const result = await loginUser('user@example.com', 'password123');
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
  
  it('should reject invalid credentials', async () => {
    const result = await loginUser('user@example.com', 'wrong-password');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
  });
});
```

### 5. Run Tests and Checks

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm type-check

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### 6. Commit Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**

```bash
# Feature with scope
git commit -m "feat(auth): add OAuth2 support"

# Bug fix
git commit -m "fix(api): handle null values in user endpoint"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api)!: change authentication flow

BREAKING CHANGE: API now requires JWT tokens instead of API keys"

# Multiple changes
git commit -m "feat(auth): add JWT refresh

- Implement token refresh endpoint
- Add refresh token rotation
- Update authentication middleware"
```

### 7. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/add-sso-authentication

# Create PR on GitHub
```

## Pull Request Guidelines

### PR Title

Use the same format as commit messages:

```
feat(auth): add SSO authentication
fix(api): resolve memory leak in cache layer
docs(contributing): add PR guidelines
```

### PR Description Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

Describe test scenarios and results.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one team member reviews the code
3. **Feedback**: Address review comments and update PR
4. **Approval**: PR must be approved before merging
5. **Merge**: Squash and merge to `main` branch

### Code Review Checklist

Reviewers should verify:

- [ ] **Functionality**: Code works as intended
- [ ] **Tests**: Adequate test coverage (aim for 80%+)
- [ ] **Code Quality**: Readable, maintainable, follows standards
- [ ] **Performance**: No obvious performance issues
- [ ] **Security**: No security vulnerabilities introduced
- [ ] **Documentation**: Code is documented, README updated if needed
- [ ] **Breaking Changes**: Clearly documented if present

## Coding Standards

### TypeScript

```typescript
// ✅ Good
interface UserProfile {
  id: string;
  email: string;
  name: string;
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  return user;
}

// ❌ Bad
async function fetchUserProfile(userId: any): Promise<any> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
}
```

### React Components

```typescript
// ✅ Good: Server Component
interface UserCardProps {
  userId: string;
}

export async function UserCard({ userId }: UserCardProps) {
  const user = await fetchUser(userId);
  
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ Good: Client Component
'use client';

interface InteractiveButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function InteractiveButton({ onClick, children }: InteractiveButtonProps) {
  return (
    <button onClick={onClick} className="btn-primary">
      {children}
    </button>
  );
}
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const user = await loginUser(email, password);
  return { success: true, user };
} catch (error) {
  logger.error('Login failed', { error, email });
  
  if (error instanceof AuthenticationError) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  throw error; // Re-throw unexpected errors
}

// ❌ Bad: Silent failures
try {
  const user = await loginUser(email, password);
  return user;
} catch {
  return null; // Loses error information
}
```

### Logging

```typescript
// ✅ Good: Structured logging
import logger from '@/lib/logger';

logger.info('User logged in', { userId: user.id, email: user.email });
logger.warn('Rate limit approaching', { userId, attempts, limit });
logger.error('Database query failed', { error, query, params });

// ❌ Bad: Console.log
console.log('User logged in:', user);
console.error(error);
```

## Testing Requirements

### Unit Tests

- **Coverage**: Aim for 80%+ code coverage
- **Isolation**: Mock external dependencies
- **Clarity**: One concept per test

```typescript
describe('User Service', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { email: 'test@example.com', name: 'Test User' };
      const user = await userService.createUser(userData);
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });
    
    it('should throw error for duplicate email', async () => {
      const userData = { email: 'existing@example.com', name: 'Test' };
      
      await expect(userService.createUser(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });
});
```

### Integration Tests

Test interactions between components:

```typescript
describe('Authentication Flow', () => {
  it('should complete full login flow', async () => {
    // 1. Login request
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    
    // 2. Access protected resource
    const profileRes = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.email).toBe('user@example.com');
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
import { test, expect } from '@playwright/test';

test('user can create and run a test', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button[type=submit]');
  
  // Create test
  await page.goto('/projects/new');
  await page.fill('[name=name]', 'My Test Project');
  await page.click('button:has-text("Create")');
  
  // Verify creation
  await expect(page.locator('h1')).toContainText('My Test Project');
});
```

## Best Practices

### Security

- **Never commit secrets** (use `.env` files)
- **Sanitize user input** using provided sanitizers
- **Use CSRF protection** for state-changing operations
- **Validate authentication** on all protected routes
- **Log security events** for audit trails

### Performance

- **Use database indexes** for frequently queried fields
- **Implement caching** for expensive operations
- **Paginate large datasets** (default: 20 items per page)
- **Optimize images** (use Next.js Image component)
- **Lazy load** non-critical components

### Accessibility

- **Semantic HTML** (use proper heading levels, landmarks)
- **ARIA labels** for interactive elements
- **Keyboard navigation** for all functionality
- **Color contrast** meeting WCAG AA standards
- **Screen reader** friendly content

### Documentation

- **Code comments** for complex logic
- **JSDoc comments** for public APIs
- **README updates** for new features
- **CHANGELOG entries** for user-facing changes

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and discussions
- **Slack**: Real-time communication (#guardian-dev)
- **Email**: <guardian@odavl.com> for private matters

### Getting Help

- **Documentation**: Check docs/ directory first
- **Search Issues**: Your question might already be answered
- **Ask Questions**: Don't hesitate to ask for help
- **Code Reviews**: Learn from feedback

### Recognition

Contributors are recognized in:

- **CONTRIBUTORS.md**: List of all contributors
- **Release Notes**: Mentions for significant contributions
- **GitHub**: Contributor badge on profile

## License

By contributing to Guardian, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE) file).

---

**Thank you for contributing to Guardian!** 🎉

Every contribution, no matter how small, makes a difference. We appreciate your time and effort in making Guardian better for everyone.

**Last Updated**: January 2025  
**Maintainer**: ODAVL Development Team
