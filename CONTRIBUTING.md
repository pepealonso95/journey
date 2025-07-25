# Contributing to Journey

Thank you for your interest in contributing to Journey! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm package manager
- Git

### Setup
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/journey.git
   cd journey
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Set up your environment variables (see README.md)
5. Run the development server:
   ```bash
   pnpm dev
   ```

## 📋 Development Process

### Branch Strategy
- `main` - Production branch, protected
- Feature branches should be created from `main`
- Use descriptive branch names: `feature/add-export-functionality`, `fix/search-bug`, etc.

### Making Changes
1. Create a new branch for your feature/fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following our coding standards
3. Test your changes thoroughly
4. Commit your changes with clear, descriptive messages
5. Push your branch and create a pull request

### Code Standards
- **TypeScript**: All new code should be written in TypeScript
- **Formatting**: We use Prettier and ESLint - run `pnpm lint` before committing
- **Components**: Follow the domain-based component organization:
  - `/components/ui/` - Basic UI primitives
  - `/components/book/` - Book-related components
  - `/components/layout/` - Layout components
  - `/components/forms/` - Form components
- **Helper Functions**: Prefer pure functions over classes for stateless utilities
- **Imports**: Import only what you need, avoid `import *`

### Testing
- Ensure `pnpm build` passes without errors
- Run `pnpm lint` to check for linting issues
- Test your changes manually in both desktop and mobile views
- Add tests for new functionality when applicable

## 🎯 What Can You Contribute?

### Good First Issues
Look for issues labeled `good first issue` or `help wanted`. These are typically:
- UI improvements
- Bug fixes
- Documentation updates
- Small feature additions

### Areas We Welcome Contributions
- **Features**: Export functionality, reading progress tracking, collections
- **UI/UX**: Design improvements, accessibility enhancements
- **Performance**: Optimization and loading improvements
- **Documentation**: README improvements, code comments, guides
- **Bug Fixes**: Any bugs you encounter while using the app

## 📝 Pull Request Process

1. **Fill out the PR template** completely
2. **Ensure CI passes** - all checks must be green
3. **Request review** from @pepealonsog
4. **Address feedback** promptly and professionally
5. **Keep PR focused** - one feature/fix per PR
6. **Update documentation** if your changes affect user-facing functionality

### PR Requirements
- [ ] Clear description of changes
- [ ] CI/CD checks pass
- [ ] Code follows project standards
- [ ] No breaking changes (unless discussed)
- [ ] Documentation updated if needed

## 🤝 Code of Conduct

### Our Standards
- **Be respectful** and inclusive in all interactions
- **Be constructive** in discussions and code reviews
- **Be patient** with new contributors
- **Be open** to feedback and different perspectives

### Unacceptable Behavior
- Harassment, discrimination, or offensive language
- Personal attacks or trolling
- Spam or irrelevant content
- Sharing private information without permission

## 🐛 Reporting Issues

Before creating an issue:
1. **Search existing issues** to avoid duplicates
2. **Use the appropriate template** (bug report or feature request)
3. **Provide clear details** and steps to reproduce
4. **Include screenshots** when helpful

## 💡 Questions?

- **General questions**: Use [GitHub Discussions](https://github.com/pepealonso95/journey/discussions)
- **Bug reports**: Use the bug report template
- **Feature requests**: Use the feature request template
- **Security issues**: Report privately via GitHub Security Advisories

## 🙏 Recognition

All contributors will be recognized in our README.md file. Significant contributions may also be highlighted in release notes.

---

Thank you for helping make Journey better! 🚀