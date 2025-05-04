const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Starting build optimization...');

// Function to recursively get folder size
function getFolderSize(folderPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(folderPath);
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += getFolderSize(filePath);
      }
    }
    
    return totalSize;
  } catch (err) {
    console.error(`Error reading directory ${folderPath}: ${err.message}`);
    return 0;
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Check initial sizes
const distPath = path.join(__dirname, 'dist');
const distElectronPath = path.join(__dirname, 'dist-electron');

console.log(`📊 Initial dist folder size: ${formatBytes(getFolderSize(distPath))}`);
console.log(`📊 Initial dist-electron folder size: ${formatBytes(getFolderSize(distElectronPath))}`);

// Remove unnecessary files
const filesToRemove = [
  // Development files that might have been included
  '.DS_Store',
  'Thumbs.db',
  '.git',
  '.github',
  '.editorconfig',
  '.eslintrc',
  '.prettierrc',
  'tsconfig.tsbuildinfo',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  
  // Debug and source maps
  '**/*.js.map',
  '**/*.css.map',
];

// Essential node modules that should NOT be removed
const essentialModules = [
  'node_modules/nedb',
  'node_modules/binary-search-tree',
  'node_modules/underscore',
  'node_modules/async',
  'node_modules/mkdirp',
  'node_modules/minimist',
  'node_modules/immediate',
  'node_modules/localforage'
];

// Remove test files and directories, but preserve essential modules
const dirsToRemove = [
  // Test directories
  '__tests__',
  'test',
  'tests',
  'coverage',
  
  // Node.js development artifacts, but exclude essential modules
  'node_modules/.bin',
  'node_modules/.cache',
  'node_modules/**/.github',
];

// Add non-essential module patterns that can be safely removed
const nonEssentialPatterns = [
  'node_modules/**/test',
  'node_modules/**/tests',
  'node_modules/**/__tests__',
  'node_modules/**/*.d.ts',
  'node_modules/**/*.md',
  'node_modules/**/LICENSE*',
  'node_modules/**/license*',
  'node_modules/**/CHANGELOG*',
  'node_modules/**/README*',
  'node_modules/**/readme*',
  'node_modules/**/CONTRIBUTING*',
  'node_modules/**/docs',
  'node_modules/**/doc',
  'node_modules/**/examples',
  'node_modules/**/demo',
  'node_modules/**/website',
];

console.log('🧹 Cleaning up unnecessary files while preserving essential modules...');

// Function to check if a path is part of essential modules
function isEssentialModule(checkPath) {
  return essentialModules.some(modulePath => checkPath.includes(modulePath));
}

// Run a cross-platform safe cleanup
try {
  // Platform-specific cleanup for dist folder
  if (process.platform === 'win32') {
    // Windows
    console.log('🪟 Running Windows-specific cleanup...');
    for (const pattern of filesToRemove) {
      try {
        execSync(`powershell -Command "Get-ChildItem -Path .\\dist -Recurse -Filter "${pattern}" | Remove-Item -Force -Recurse"`, { stdio: 'ignore' });
        execSync(`powershell -Command "Get-ChildItem -Path .\\dist-electron -Recurse -Filter "${pattern}" | Remove-Item -Force -Recurse"`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors for non-existent files
      }
    }
    
    // For directories, check if they're not in the essential modules list
    for (const pattern of [...dirsToRemove, ...nonEssentialPatterns]) {
      try {
        // Add special handling to preserve essential modules
        execSync(`powershell -Command "$items = Get-ChildItem -Path .\\dist -Recurse -Filter "${pattern}"; foreach($item in $items) { if(-not($item.FullName -match 'nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage')) { Remove-Item $item.FullName -Force -Recurse } }"`, { stdio: 'ignore' });
        execSync(`powershell -Command "$items = Get-ChildItem -Path .\\dist-electron -Recurse -Filter "${pattern}"; foreach($item in $items) { if(-not($item.FullName -match 'nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage')) { Remove-Item $item.FullName -Force -Recurse } }"`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors for non-existent directories
      }
    }
  } else {
    // macOS/Linux
    console.log('🐧 Running Unix-specific cleanup...');
    for (const pattern of filesToRemove) {
      try {
        execSync(`find ./dist -name "${pattern}" -type f -delete`, { stdio: 'ignore' });
        execSync(`find ./dist-electron -name "${pattern}" -type f -delete`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors for non-existent files
      }
    }
    
    // For directories, use a more careful approach with grep to exclude essential modules
    for (const pattern of dirsToRemove) {
      try {
        // Find directories matching the pattern but exclude essential modules
        execSync(`find ./dist -path "${pattern}" -type d | grep -v -E '(nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage)' | xargs rm -rf`, { stdio: 'ignore' });
        execSync(`find ./dist-electron -path "${pattern}" -type d | grep -v -E '(nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage)' | xargs rm -rf`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors for non-existent directories or when grep finds nothing
      }
    }
    
    // Handle non-essential patterns more carefully
    for (const pattern of nonEssentialPatterns) {
      try {
        // Use a safer approach with grep to filter out essential modules
        execSync(`find ./dist -path "${pattern}" | grep -v -E '(nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage)' | xargs rm -rf`, { stdio: 'ignore' });
        execSync(`find ./dist-electron -path "${pattern}" | grep -v -E '(nedb|binary-search-tree|underscore|async|mkdirp|minimist|immediate|localforage)' | xargs rm -rf`, { stdio: 'ignore' });
      } catch (err) {
        // Ignore errors for non-existent paths or when grep finds nothing
      }
    }
  }
  
  console.log('✅ Cleanup completed while preserving database modules');
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
}

// Check final sizes
console.log(`📊 Final dist folder size: ${formatBytes(getFolderSize(distPath))}`);
console.log(`📊 Final dist-electron folder size: ${formatBytes(getFolderSize(distElectronPath))}`);
console.log('🎉 Build optimization completed!');