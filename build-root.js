const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, 'streamguard-ai', 'frontend');
const rootDist = path.resolve(__dirname, 'dist');
const frontendDist = path.resolve(frontendDir, 'dist');

console.log('--- [FlowShield Monorepo Build] Starting ---');
console.log('Frontend directory:', frontendDir);

// 1. Install frontend dependencies
console.log('1. Installing frontend dependencies...');
execSync('npm install --prefer-offline --no-audit', { cwd: frontendDir, stdio: 'inherit' });

// 2. Build frontend with Vite
console.log('2. Building frontend production bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// 3. Ensure root dist exists and copy files
console.log('3. Copying dist from', frontendDist, 'to', rootDist);
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true, force: true });
}

fs.cpSync(frontendDist, rootDist, { recursive: true });

if (fs.existsSync(path.join(rootDist, 'index.html'))) {
  console.log('--- [FlowShield Monorepo Build] Succeeded! index.html verified in ./dist ---');
} else {
  console.error('--- [FlowShield Monorepo Build] Error: index.html not found in ./dist! ---');
  process.exit(1);
}
