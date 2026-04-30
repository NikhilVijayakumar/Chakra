---
name: package-maintainer
description: Manages package.json dependencies, vulnerabilities, deprecations, and updates for Electron/React apps.
---

# Package-Maintainer Workflow

Manual trigger: `/package-maintainer`

## 1. Package.json Validation

Before any analysis, validate the package.json:

- Verify valid JSON structure
- Check required fields exist: `name`, `version`
- Validate `dependencies` and `devDependencies` objects are present
- Verify `scripts` object has essential commands (`start`, `build` if applicable)

If validation fails, report the issues and stop.

## 2. Vulnerability Scanning & Fixing

Run `npm audit --json` to identify vulnerabilities.

For each vulnerability found:
- **Critical/High**: Immediate attention required
- **Medium**: Fix soon
- **Low**: Fix when convenient

**Auto-fix**: Run `npm audit fix` to apply automatic fixes where possible.

**Manual fixes**: For unfixable vulnerabilities:
- Check if upgrading the affected package resolves it
- Search for alternative packages if no fix available
- Flag for manual review if no solution exists

Report all vulnerabilities found and their resolution status.

## 3. Dependency Updates

Install `npm-check-updates` if not present:
```
npm install -g npm-check-updates
```

Run `ncu --depth 2` to check dependencies for updates.

For each outdated package:
- Check changelog for breaking changes
- Update with `ncu -u` for all or `ncu -u <package>` for specific
- Run `npm install` to update lockfile
- Test the application to verify compatibility

Report all outdated packages and update status.

## 4. Deprecation Handling

Run `npm deprecated` to check for deprecated packages.

For each deprecated package:
- Identify the deprecation message and replacement
- If auto-upgrade path exists, apply it
- Otherwise, research and suggest modern alternatives
- Flag packages with no maintainer activity

Report all deprecated packages with replacement suggestions.

## 5. Version Compatibility

- Check Node.js version from `.nvmrc` or `engines` field in package.json
- Verify Electron version compatibility if applicable
- Validate peer dependencies if present

Report any compatibility issues found.

## Summary

After running all checks, provide a summary:
- Total vulnerabilities found and fixed
- Total outdated packages and updated
- Total deprecated packages and replacements
- Any compatibility issues to address

(End of file - total 83 lines)