# Contributing Guidelines

## 🚫 Main Branch Protection

**Direct pushes to the `main` branch are NOT allowed!** All changes must go through pull requests.

## 🔄 Development Workflow

### 1. Create a Feature Branch
```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to a new feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-description
# or
git checkout -b hotfix/urgent-fix
```

### 2. Make Your Changes
```bash
# Make your changes, then stage and commit
git add .
git commit -m "feat: add new feature description"
# Use conventional commit messages:
# feat: new feature
# fix: bug fix
# docs: documentation changes
# style: formatting changes
# refactor: code refactoring
# test: adding tests
# chore: maintenance tasks
```

### 3. Push Your Branch
```bash
git push origin feature/your-feature-name
```

### 4. Create a Pull Request
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Fill in the minimal PR description with core changes mentioned (Use AI)
4. Request reviews from team members
5. Wait for approval and CI checks to pass
6. Merge the PR (squash and merge recommended)

## 🛡️ Branch Protection Rules

The following protections are in place:
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Restrict pushes that create files
- ✅ Include administrators in protection rules

## 🚨 Emergency Situations

If you absolutely need to push directly to main (emergency only):
```bash
git push origin main --force-with-lease
```
**Note**: This will only work if you have admin privileges and should be used sparingly.

## 📋 Pre-commit Hooks

Local pre-commit hooks are installed to prevent accidental pushes to main. If you need to bypass them for legitimate reasons, you can use:
```bash
git push origin main --force-with-lease
```

## 🤝 Code Review Process

1. All PRs require at least 1 approval
2. All CI checks must pass
3. Code must be up to date with main
4. Use meaningful commit messages
5. Keep PRs focused and reasonably sized