// Dev-only sanity check: every icon name used in JSX must exist in Icon.jsx
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath (not .pathname) — .pathname yields "/G:/..." on Windows,
// which join() turns into "G:\G:\..." and breaks readFileSync.
const root = fileURLToPath(new URL('../', import.meta.url));
const srcDir = join(root, 'src');
const iconPath = join(srcDir, 'components', 'ui', 'Icon.jsx');
const iconSource = readFileSync(iconPath, 'utf8');

// Extract icon keys defined in ICONS
const keys = new Set();
const keyRe = /^\s{2}(['"])([a-z0-9-]+)\1\s*:/gm;
let m;
while ((m = keyRe.exec(iconSource)) !== null) keys.add(m[2]);

// Walk src for jsx files
const files = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.jsx') || p.endsWith('.js')) files.push(p);
  }
}
walk(srcDir);

const used = new Set();
const useRe = /name="([a-z0-9-]+)"/g;
let missing = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  let mm;
  while ((mm = useRe.exec(text)) !== null) {
    const icon = mm[1];
    if (used.has(icon)) continue;
    used.add(icon);
    if (!keys.has(icon)) missing.push(`${relative(join(root, '.') , file)}: ${icon}`);
  }
}

console.log('defined icons:', keys.size);
console.log('used icons in markup:', used.size);
console.log('MISSING:', missing.length === 0 ? 'none' : missing.join('\n'));