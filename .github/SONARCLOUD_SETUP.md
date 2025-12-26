# SonarCloud Setup Guide for ThirdScreen

## Quick Setup (5 minutes)

### 1. Configure SonarCloud Project

1. Go to [SonarCloud](https://sonarcloud.io)
2. Click "+" and "Analyze new project"
3. Select your GitHub repository (ThirdScreen)
4. Note your **Organization** and **Project Key**

### 2. Update Configuration Files

Edit `sonar-project.properties`:
```properties
sonar.projectKey=YOUR_PROJECT_KEY_HERE
sonar.organization=YOUR_ORG_HERE
```

Replace:
- `YOUR_PROJECT_KEY_HERE` with your SonarCloud project key
- `YOUR_ORG_HERE` with your SonarCloud organization name

Also update the GitHub links in the same file.

### 3. Add GitHub Secret

1. In SonarCloud:
   - Go to My Account > Security
   - Generate a new token
   - Copy the token

2. In GitHub:
   - Go to your repository Settings
   - Navigate to Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `SONAR_TOKEN`
   - Value: paste the token from SonarCloud
   - Click "Add secret"

### 4. Update GitHub Workflow

Edit `.github/workflows/build.yml` and update the SonarCloud arguments:
```yaml
-Dsonar.projectKey=YOUR_PROJECT_KEY_HERE
-Dsonar.organization=YOUR_ORG_HERE
```

### 5. Test It

Push a commit to any branch:
```bash
git add .
git commit -m "chore: configure SonarCloud"
git push
```

Check GitHub Actions tab - you should see:
- ✅ Version check
- ✅ Lint and format
- ✅ **SonarCloud Analysis** (new!)
- ✅ Build

## What Changed

### CI/CD Improvements

1. **Runs on all branches**: Pipeline now runs on every push (not just main/develop)
2. **SonarCloud integration**: Automatic code quality analysis
3. **Code coverage**: Tests run with coverage reporting
4. **Better organization**: Clear job dependencies

### New Files

- `sonar-project.properties` - SonarCloud configuration
- `.github/copilot-instructions/sonarcloud-setup.md` - This guide

### What You Get

From SonarCloud dashboard, you'll see:
- Code quality metrics (bugs, vulnerabilities, code smells)
- Code coverage percentage
- Security hotspots
- Technical debt estimation
- Maintainability ratings
- Automatic PR comments with analysis

## Troubleshooting

### "Could not find or load main class org.sonar.scanner.cli.Main"
- The SonarCloud action will download scanner automatically
- No action needed

### "Please provide a valid value for sonar.projectKey"
- Update `sonar-project.properties` with your project key
- Update the workflow args as well

### "Unauthorized: 401"
- Verify `SONAR_TOKEN` secret is correctly set in GitHub
- Regenerate token in SonarCloud if needed

### Coverage not showing
- Ensure tests run: `npm run test -- --coverage`
- Check `coverage/lcov.info` is generated
- Verify path in `sonar-project.properties`

## Next Steps (Optional)

1. **Quality Gates**: Configure in SonarCloud to block PRs with issues
2. **Branch Protection**: Require SonarCloud check to pass before merge
3. **Rust Analysis**: Add Rust code analysis (requires additional setup)
4. **Custom Rules**: Configure project-specific quality rules

## Useful Links

- [SonarCloud Dashboard](https://sonarcloud.io/projects)
- [SonarCloud GitHub Action](https://github.com/SonarSource/sonarcloud-github-action)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
