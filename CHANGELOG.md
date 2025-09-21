# CHANGELOG

## 🎉 **v1.0.4 - The UI Enhancement Release** - 2025-01-27

**🎯 UI Improvements: Enhanced sticky toolbar and scrollbar functionality**

### 🚀 Major Changes
- **Sticky Toolbar Fix**: Improved sticky toolbar behavior for better user experience
- **Scrollbar Enhancement**: Enhanced scrollbar functionality and visual appearance

### 🐛 Bug Fixes
- **Toolbar Positioning**: Fixed sticky toolbar positioning issues
- **Scrollbar Styling**: Improved scrollbar styling and interaction

---

## 🎉 **v1.0.3 - The Size Optimization Release** - 2025-01-27

**🎯 MASSIVE ACHIEVEMENT: Reduced app size from 1.57GB to 149MB (90% reduction!)**

### 🚀 Major Changes
- **Framework Migration**: Migrated from React.js to vanilla JavaScript for improved performance and reduced bundle size
- **UI Redesign**: Completely redesigned user interface with modern, clean aesthetics and improved user experience

### 🎯 **MASSIVE Size Optimization Achievement**
- **App Size Reduction**: Reduced from **1.57GB to 149MB** - a **90% size reduction!**
- **Target Exceeded**: Achieved **149MB** (265MB below the 414MB target)
- **Competitive Size**: Now comparable to major apps like Notion (104MB)
- **Build Format**: Optimized DMG packaging with single x64 architecture

### 🐛 Bug Fixes
- **macOS Build Fix**: Resolved missing 'nedb' module error that prevented the app from running on macOS
- **Database Loading**: Improved error handling when loading the database module for better stability
- **Build Process**: Fixed DMG packaging issues by updating to UDRW format for reliable macOS builds

### 🔧 Build Improvements
- **Dependency Cleanup**: Removed all unused Node.js modules (nedb, underscore, async, etc.)
- **Language Optimization**: Limited to English only, eliminating 50+ language packs
- **Architecture Optimization**: Single x64 build instead of dual x64/arm64
- **Electron Version**: Optimized to Electron 11.5.0 for best size/performance balance
- **Build Configuration**: Enhanced electron-builder settings for maximum compression

### 📦 Technical Changes
- **Framework Simplification**: Removed React dependencies and build complexity
- **Bundle Optimization**: Significantly reduced application size and improved startup performance
- **Updated electron-builder configuration** for better cross-platform compatibility
- **Improved build artifact naming** and organization
- **Enhanced error handling** throughout the build process

---

## [v1.0.2] - Previous Release

### Features
- Initial release of Stickier Note application
- Basic sticky note functionality
- Cross-platform support (macOS, Windows, Linux)

