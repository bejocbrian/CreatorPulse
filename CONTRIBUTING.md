# Contributing to Checklist Subscription Backend

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker and Docker Compose
- Git

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/checklist-subscription-backend.git
   cd checklist-subscription-backend
   ```
3. Run the setup script:
   ```bash
   ./scripts/setup-local.sh
   ```
4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Making Changes

1. Make your changes in your feature branch
2. Follow the code style guidelines (see below)
3. Write or update tests as needed
4. Update documentation if necessary
5. Commit your changes with clear commit messages

### Testing Your Changes

```bash
# Run tests
npm test

# Run linting
npm run lint

# Run type checking
npm run build

# Test locally
npm run dev
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add invoice PDF generation
fix: resolve webhook signature verification issue
docs: update API documentation for usage endpoints
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` types when possible
- Use meaningful variable and function names
- Keep functions small and focused

### Formatting

We use Prettier for code formatting:

```bash
npm run format
```

### Linting

We use ESLint for code linting:

```bash
npm run lint
```

### Code Organization

- Place route handlers in `src/routes/`
- Place business logic in `src/services/`
- Place middleware in `src/middleware/`
- Place utilities in `src/utils/`
- Keep files focused and single-purpose

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `stripe.service.ts`)
- **Classes**: `PascalCase` (e.g., `StripeService`)
- **Functions**: `camelCase` (e.g., `createCheckoutSession`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- **Interfaces**: `PascalCase` with descriptive names (e.g., `AuthRequest`)

### Error Handling

- Use try-catch blocks for async operations
- Log errors with appropriate context
- Return meaningful error messages
- Use custom error classes when appropriate

Example:
```typescript
try {
  const result = await someAsyncOperation();
  logger.info('Operation completed', { result });
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new AppError('User-friendly message', 500);
}
```

### Logging

- Use the Winston logger from `src/utils/logger.ts`
- Include relevant context in logs
- Use appropriate log levels:
  - `error`: Critical errors
  - `warn`: Warnings
  - `info`: Important information
  - `debug`: Detailed debugging info

Example:
```typescript
logger.info('User registered', {
  userId: user.id,
  email: user.email,
});
```

## Database Changes

### Creating Migrations

1. Update `prisma/schema.prisma`
2. Generate migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Test migration locally
4. Commit both schema and migration files

### Migration Guidelines

- Keep migrations small and focused
- Test migrations in both directions (up/down)
- Document breaking changes
- Consider data migration needs

## Testing

### Writing Tests

- Write unit tests for services
- Write integration tests for routes
- Use descriptive test names
- Mock external dependencies

Example:
```typescript
describe('StripeService', () => {
  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      // Test implementation
    });

    it('should throw error if organization not found', async () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Documentation

### Code Documentation

- Add JSDoc comments for public functions
- Document complex logic
- Keep comments up-to-date

### API Documentation

- Update `docs/API.md` for endpoint changes
- Update `docs/openapi.yaml` for API spec changes
- Include request/response examples

### README Updates

Update the README if you:
- Add new features
- Change configuration options
- Add new dependencies
- Modify setup process

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with main

### Submitting PR

1. Push your branch to your fork
2. Open a pull request against `main`
3. Fill out the PR template completely
4. Link any related issues
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

- Maintainers will review your PR
- Address feedback and make changes
- Once approved, PR will be merged
- Your contribution will be credited

## Issue Reporting

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation (optional)
- Alternative solutions considered

## Security Issues

**Do not** open public issues for security vulnerabilities.

Instead, email security concerns to: security@checklistapp.com

## Questions?

- Check existing issues and documentation
- Open a discussion for questions
- Join our community chat (if available)

## Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes
- Documentation credits

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to make this project better! 🎉
