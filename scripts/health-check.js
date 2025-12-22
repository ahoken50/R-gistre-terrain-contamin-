import fs from 'fs';
import path from 'path';

// Basic health check to ensure critical files exist
const criticalFiles = [
    'src/app.js',
    'index.html',
    'package.json'
];

let hasError = false;

criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ Critical file missing: ${file}`);
        hasError = true;
    } else {
        console.log(`✅ File exists: ${file}`);
    }
});

if (hasError) {
    process.exit(1);
} else {
    console.log('✅ Health check passed!');
    process.exit(0);
}
