const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Copy HTML, CSS, and JS files
const filesToCopy = [
    { src: 'src/index.html', dest: 'dist/index.html' },
    { src: 'src/styles.css', dest: 'dist/styles.css' },
    { src: 'src/app.js', dest: 'dist/app.js' }
];

filesToCopy.forEach(file => {
    if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, file.dest);
        console.log(`✓ Copied ${file.src} to ${file.dest}`);
    } else {
        console.error(`✗ Source file not found: ${file.src}`);
    }
});

console.log('Build completed!');
