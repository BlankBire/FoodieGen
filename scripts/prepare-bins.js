const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const binDir = path.join(root, 'bin', 'msvc');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const sys32 = 'C:\\Windows\\System32';
const msvcDlls = ['msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll'];

const { execSync } = require('child_process');

console.log('[PREPARE-BINS] Copying MSVC DLLs to project root...');

msvcDlls.forEach(dll => {
  const src = path.join(sys32, dll);
  const dest = path.join(binDir, dll);
  
  if (fs.existsSync(src)) {
    console.log(`[PREPARE-BINS] Copying ${dll}...`);
    fs.copyFileSync(src, dest);
  } else {
    console.warn(`[PREPARE-BINS] WARNING: ${dll} not found in System32!`);
  }
});

console.log('[PREPARE-BINS] Generating template database...');
const templateDbPath = path.join(binDir, 'template.db');
const schemaPath = path.join(root, 'src', 'api', 'prisma', 'schema.prisma');

try {
  const env = { ...process.env, DATABASE_URL: `file:${templateDbPath}` };
  execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`, { 
    env,
    stdio: 'inherit' 
  });
  console.log('[PREPARE-BINS] template.db generated successfully.');
} catch (error) {
  console.error('[PREPARE-BINS] Failed to generate template.db:', error.message);
}

console.log('[PREPARE-BINS] Done.');
