const fs = require('fs');
const path = require('path');

const hash = 'hms-portal-9f8b2c1a';

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

const srcDir = path.join(__dirname, 'src');

// 1. Replace strings in all ts/tsx files
walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content
            .replace(/"\/admin\//g, '"/' + hash + '/')
            .replace(/"\/admin"/g, '"/' + hash + '"')
            .replace(/"\/admin:\/path\*"/g, '"/' + hash + ':/path*"')
            .replace(/\["\/admin\/:path\*"\]/g, '["/' + hash + '/:path*"]');
            
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent);
            console.log('Updated: ' + filePath);
        }
    }
});

// 2. Rename directory
const oldAdminPath = path.join(srcDir, 'app', 'admin');
const newAdminPath = path.join(srcDir, 'app', hash);

if (fs.existsSync(oldAdminPath)) {
    fs.renameSync(oldAdminPath, newAdminPath);
    console.log('Renamed folder /admin to /' + hash);
} else {
    console.log('Admin folder not found at ' + oldAdminPath);
}
