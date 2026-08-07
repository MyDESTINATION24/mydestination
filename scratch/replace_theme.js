const fs = require('fs');
const path = require('path');

const directory = path.join(process.cwd(), 'frontend/src/app/partner');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const originalContent = content;
            
            // Replace surface colors with blue-600
            content = content.replace(/-\[var\(--color-surface\)\]/g, '-blue-600');
            // Replace textDark with gray-900
            content = content.replace(/-\[var\(--color-textDark\)\]/g, '-gray-900');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated:', fullPath);
            }
        }
    }
}

processDirectory(directory);
console.log('Done');
