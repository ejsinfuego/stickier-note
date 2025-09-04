# Publishing Guide for Stickier Note

This guide covers how to publish new versions of Stickier Note to GitHub releases.

## Prerequisites

- GitHub repository access
- Node.js and npm installed
- All changes committed and pushed to main branch

## Publishing Process

### 1. Update Version and Changelog

**Update package.json version:**
```bash
# Edit package.json and change the version number
# Example: "version": "1.0.2" → "version": "1.0.3"
```

**Update CHANGELOG.md:**
- Add new version section at the top
- Document all changes, fixes, and improvements
- Use consistent formatting with emojis and clear descriptions

### 2. Build the Application

**Build for macOS:**
```bash
npm run package:mac
```

**Build for all platforms:**
```bash
npm run package:all
```

**Build without publishing:**
```bash
npm run build
```

### 3. Publishing Options

#### Option A: Auto-publish to GitHub (Requires Setup)

**Set up GitHub Personal Access Token:**
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "Stickier Note Auto-Publish"
4. Select scopes: `repo` (private) or `public_repo` (public)
5. Copy the token

**Set token and publish:**
```bash
export GH_TOKEN=your_token_here
npm run publish
```

#### Option B: Manual GitHub Release (Recommended for now)

1. **Go to GitHub repository**
2. **Click "Releases" in the right sidebar**
3. **Click "Create a new release"**
4. **Fill in release details:**
   - **Tag version**: `v1.0.3` (use semantic versioning)
   - **Release title**: `Stickier Note v1.0.3`
   - **Description**: Copy content from `CHANGELOG.md`
5. **Upload packages**: Drag and drop `.dmg` files from `dist/` folder
6. **Click "Publish release"**

### 4. Post-Release Steps

**Commit and push changes:**
```bash
git add .
git commit -m "Release v1.0.3 - [Brief description of changes]"
git push origin main
```

**Tag the release:**
```bash
git tag v1.0.3
git push origin v1.0.3
```

## Version Numbering

Use [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH**
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Examples:
- `1.0.2` → `1.0.3` (bug fix)
- `1.0.3` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

## Troubleshooting

### DMG Build Issues
If you encounter `hdiutil` errors:
- Check the DMG format in `package.json`
- Use `"format": "UDRW"` for reliable builds
- Avoid `"format": "ULFO"` or `"format": "UDZO"`

### GitHub Token Issues
- Ensure `GH_TOKEN` environment variable is set
- Verify token has correct repository permissions
- Check token hasn't expired

### Build Failures
- Run `npm run clean` to clear build cache
- Check for missing dependencies
- Verify all source files are committed

## File Locations

- **Built packages**: `dist/` folder
- **macOS packages**: `dist/Stickier-Note-{version}.dmg`
- **Source code**: `src/` folder
- **Build config**: `package.json` → `build` section

## Quick Reference

```bash
# Complete release workflow
npm run package:mac                    # Build macOS package
# Create GitHub release manually with files from dist/
git add . && git commit -m "Release v1.0.3" && git push
git tag v1.0.3 && git push origin v1.0.3
```

## Notes

- Always test the built package before releasing
- Keep changelog up-to-date with each release
- Consider using GitHub Actions for automated releases in the future
- Backup important files before major changes
