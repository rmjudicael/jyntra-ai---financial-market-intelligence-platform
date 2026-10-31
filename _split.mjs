import fs from 'node:fs';
const src = fs.readFileSync('server.ts','utf8');
const marker = '// ---------------------------------------------------------------------------\n// Mount Vite Middleware (Dev) or Static Files (Production)';
const idx = src.indexOf(marker);
if (idx < 0) throw new Error('marker not found');
let body = src.slice(0, idx).trimEnd() + '\n';
// Production-only static server lives in server.ts; api.ts exports the app.
body += '\n// ---------------------------------------------------------------------------\nexport { app };\n';
fs.writeFileSync('server/api.ts', body);
console.log('written', body.length, 'chars');
