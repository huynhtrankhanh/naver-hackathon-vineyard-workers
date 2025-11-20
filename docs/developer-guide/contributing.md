# Contributing to SmartMoney

Thank you for your interest in contributing to SmartMoney! This guide will help you get started.

## 📋 Before You Begin

1. Read the [Code of Conduct](#code-of-conduct)
2. Check [existing issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
3. Review the [Developer Setup Guide](docs/developer-guide/setup.md)
4. Understand the [Architecture](docs/developer-guide/architecture.md)

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR-USERNAME/naver-hackathon-vineyard-workers.git
cd naver-hackathon-vineyard-workers

# Add upstream remote
git remote add upstream https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers.git
```

### 2. Set Up Development Environment

Follow the [Developer Setup Guide](docs/developer-guide/setup.md) to install dependencies and configure your environment.

### 3. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

## 💻 Development Workflow

### Making Changes

1. **Write Clean Code**
   - Follow TypeScript best practices
   - Use meaningful variable and function names
   - Add comments for complex logic
   - Keep functions small and focused

2. **Follow Code Style**
   - Run linter: `npm run lint`
   - Use existing code as examples
   - Consistent indentation (2 spaces)
   - TypeScript types for all functions

3. **Test Your Changes**
   - Write unit tests for new functions
   - Test manually in the app
   - Verify nothing breaks
   - Check in multiple browsers/devices

### Commit Guidelines

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(budget): correct spent amount calculation"
git commit -m "docs(api): update endpoint documentation"
```

### Testing

```bash
# Frontend
cd Frontend-MoneyTrack
npm run test.unit     # Unit tests
npm run test.e2e      # E2E tests
npm run lint          # Linting

# Backend
cd backend
npm test              # Unit tests (future)
npm run build         # TypeScript compilation
```

## 📝 Pull Request Process

### Before Submitting

- [ ] Code compiles without errors
- [ ] Tests pass
- [ ] Linter passes
- [ ] Documentation updated (if needed)
- [ ] Screenshots added (for UI changes)
- [ ] Commit messages follow convention
- [ ] Branch is up-to-date with main

### Submitting PR

1. **Push Your Branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Select your feature branch
   - Fill out the PR template

3. **PR Title Format**
   ```
   [Type] Brief description
   ```
   Examples:
   - `[Feature] Add export to CSV functionality`
   - `[Fix] Resolve budget calculation issue`
   - `[Docs] Update API reference`

4. **PR Description Should Include:**
   - What changes were made
   - Why the changes were needed
   - How to test the changes
   - Screenshots (for UI changes)
   - Related issues (if any)

### Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, PR will be merged
4. Your contribution will be credited!

## 🐛 Reporting Bugs

### Before Reporting

1. Check if bug already reported
2. Try to reproduce on latest version
3. Gather relevant information

### Bug Report Should Include

- **Description**: Clear summary of the bug
- **Steps to Reproduce**: 
  1. Go to '...'
  2. Click on '...'
  3. See error
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**:
  - OS: [e.g., Windows 10, macOS 12]
  - Browser: [e.g., Chrome 96, Safari 15]
  - Version: [e.g., commit hash or release]

### Create Issue

```bash
# Use the bug report template on GitHub Issues
# Include all information listed above
# Add label: "bug"
```

## 💡 Suggesting Features

### Before Suggesting

1. Check if feature already requested
2. Consider if it fits project scope
3. Think about implementation

### Feature Request Should Include

- **Problem**: What problem does this solve?
- **Solution**: Your proposed solution
- **Alternatives**: Other solutions considered
- **Additional Context**: Mockups, examples, etc.

### Create Issue

```bash
# Use the feature request template on GitHub Issues
# Include all information listed above
# Add label: "enhancement"
```

## 📚 Documentation

Documentation contributions are highly valued!

### Types of Documentation

- **User Guides**: Help users understand features
- **Developer Guides**: Help developers contribute
- **API Reference**: Document API endpoints
- **Code Comments**: Explain complex code

### Documentation Standards

- Clear and concise language
- Code examples where applicable
- Screenshots for visual features
- Cross-references to related docs
- Up-to-date with current code

### Where to Contribute

- `docs/user-guide/` - User documentation
- `docs/developer-guide/` - Developer documentation
- `docs/api-reference/` - API documentation
- Code comments - Inline documentation

## 🔍 Code Review Guidelines

### As a Reviewer

- Be respectful and constructive
- Focus on code, not the person
- Explain why changes are needed
- Suggest improvements with examples
- Approve when ready, request changes when needed

### As a Contributor

- Don't take feedback personally
- Ask questions if unclear
- Respond to all comments
- Push fixes promptly
- Thank reviewers for their time

## 🎨 UI/UX Contributions

### Design Guidelines

- **Mobile-First**: Design for mobile, enhance for desktop
- **Ionic Components**: Use existing Ionic components
- **Consistency**: Follow existing design patterns
- **Accessibility**: Ensure features are accessible
- **Performance**: Optimize for speed

### UI Changes Should Include

- Screenshots of before/after
- Multiple device sizes tested
- Dark/light mode consideration (future)
- Accessibility testing

## 🔐 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email the maintainers privately
2. Provide detailed description
3. Include steps to reproduce
4. Wait for acknowledgment
5. Allow time for fix before disclosure

### Security Best Practices

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries
- Follow authentication best practices
- Keep dependencies updated

## 🧪 Testing Guidelines

### What to Test

- New features you add
- Bug fixes you implement
- Edge cases and error handling
- Different screen sizes
- Different browsers

### Test Coverage Goals

- Critical paths: 80%+
- New features: 70%+
- Bug fixes: 100% (test the bug)

### Writing Tests

```typescript
// Frontend - Vitest example
import { describe, it, expect } from 'vitest';

describe('calculateBalance', () => {
  it('should calculate correct balance', () => {
    const income = 5000;
    const expenses = 3000;
    expect(calculateBalance(income, expenses)).toBe(2000);
  });
});
```

## 📦 Dependency Management

### Adding Dependencies

1. **Check if necessary**: Can you use existing libraries?
2. **Research library**: Is it maintained? Any security issues?
3. **Check size**: Will it bloat the bundle?
4. **Discuss first**: Open an issue to discuss

### Updating Dependencies

- Keep dependencies reasonably current
- Test thoroughly after updates
- Check for breaking changes
- Update package-lock.json

## 🌍 Internationalization

Future consideration for multiple languages:

- Vietnamese (primary)
- English
- Use i18n libraries
- Externalize all strings
- Consider RTL languages

## 🤝 Community

### Ways to Contribute

- 💻 Code contributions
- 📝 Documentation
- 🐛 Bug reports
- 💡 Feature suggestions
- 🎨 Design improvements
- 🧪 Testing
- 📢 Spreading the word

### Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Pull Requests**: Code contributions
- **Code Reviews**: Feedback on PRs

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:

- Age
- Body size
- Disability
- Ethnicity
- Gender identity and expression
- Level of experience
- Nationality
- Personal appearance
- Race
- Religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and will take appropriate action in response to any unacceptable behavior.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙋 Questions?

- Read the [docs](docs/README.md)
- Check [existing issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
- Ask in [discussions](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/discussions)
- Contact maintainers

## 🎉 Thank You!

Every contribution, no matter how small, is appreciated. Thank you for helping make SmartMoney better!

---

**Happy Contributing! 🚀**
