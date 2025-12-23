import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');

const requiredFiles = [
    'src/app.js',
    'index.html',
    'package.json'
];

let hasError = false;

console.log('🏥 Running health check...');

requiredFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing file: ${file}`);
        hasError = true;
    } else {
        console.log(`✅ Found: ${file}`);
    }
});

if (hasError) {
    console.error('💥 Health check failed!');
    process.exit(1);
} else {
    console.log('✨ Health check passed!');
    process.exit(0);
}
