const fs = require('fs');
const path = require('path');

// Remove language files from the built app
function removeLanguageFiles() {
    const appPath = path.join(__dirname, 'dist/mac/Stickier Note.app/Contents/Resources');
    
    if (fs.existsSync(appPath)) {
        const files = fs.readdirSync(appPath);
        
        files.forEach(file => {
            if (file.endsWith('.lproj')) {
                const fullPath = path.join(appPath, file);
                if (fs.statSync(fullPath).isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                    console.log(`Removed language folder: ${file}`);
                }
            }
        });
        
        console.log('Language files removed successfully!');
    } else {
        console.log('App path not found, skipping language removal');
    }
}

removeLanguageFiles();
