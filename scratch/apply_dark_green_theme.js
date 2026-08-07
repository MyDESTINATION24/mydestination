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
            
            // Replace blue theme colors with dark green [#0A4720]
            content = content.replace(/blue-600/g, '[#0A4720]');
            content = content.replace(/blue-700/g, '[#063818]');
            content = content.replace(/blue-500/g, '[#0E5A2A]');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Updated to Dark Green:', fullPath);
            }
        }
    }
}

processDirectory(directory);
console.log('Done replacing blue with dark green!');
