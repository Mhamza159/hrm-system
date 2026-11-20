const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./frontend/src');

const trueRightDrawers = [];
const centeredModals = [];
const heavyBackdropFiles = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  const relPath = path.relative('.', f).replace(/\\/g, '/');

  // Exclude non-modal files
  if (/Sidebar|Navbar|Header|AppLayout|Layout|NetworkProgressBar/.test(base)) return;

  const isModalOrDrawer = 
    /Modal|Drawer|Dialog|Sheet/.test(base) ||
    /fixed\s+inset-0/.test(content);

  if (!isModalOrDrawer) return;

  // Real overlay component check: must have a fixed backdrop or fixed position
  if (!/fixed\s+inset-0/.test(content) && !/fixed\s+[^"'>]*(right-0|inset-y-0)/.test(content)) {
    return;
  }

  // Exact detection of right-docked drawer / slide-over container:
  // 1. `slide-in-from-right`
  // 2. An outer container with `fixed inset-0 ... justify-end`
  // 3. A container with `fixed ... right-0` and `(h-full|inset-y-0)`
  // 4. `translate-x-full`
  // 5. Drawer in name and docked right
  const isRightSide = 
    /slide-in-from-right/.test(content) ||
    /fixed\s+inset-0[^"'>]*\bjustify-end\b/.test(content) ||
    /fixed\s+[^"'>]*\bjustify-end\b[^"'>]*inset-0/.test(content) ||
    /fixed\s+[^"'>]*\binset-y-0\s+right-0\b/.test(content) ||
    /fixed\s+[^"'>]*\bright-0\s+top-0\b/.test(content) ||
    /fixed\s+[^"'>]*\btop-0\s+right-0\b/.test(content) ||
    (/fixed\s+[^"'>]*\bright-0\b/.test(content) && /\bh-full\b/.test(content)) ||
    /translate-x-full/.test(content) ||
    (/Drawer/.test(base) && (/\bright-0\b/.test(content) || /slide-in/.test(content) || /right/.test(content)));

  // Heavy backdrop detection:
  // Opaque or excessively dark overlays, e.g. bg-black/70, bg-black/75, bg-black/80, bg-black/90, bg-black/95, bg-black/100, bg-slate-950/..., bg-black bg-opacity-75+
  const hasHeavyBackdrop = 
    /bg-black\/(7[0-9]|8[0-9]|9[0-9]|100)/.test(content) ||
    /bg-black\s+bg-opacity-(7[0-9]|8[0-9]|9[0-9])/.test(content) ||
    /bg-slate-950\/(7[0-9]|8[0-9]|9[0-9]|100)/.test(content) ||
    /bg-slate-900\/(8[0-9]|9[0-9]|100)/.test(content) ||
    /shadow-\[0_0_.*black/.test(content);

  if (hasHeavyBackdrop) {
    heavyBackdropFiles.push({ file: relPath, name: base });
  }

  if (isRightSide) {
    trueRightDrawers.push({ file: relPath, name: base });
  } else {
    centeredModals.push({ file: relPath, name: base });
  }
});

console.log('=== EXACT REFINED AUDIT ===');
console.log('Total Modals/Drawers:', trueRightDrawers.length + centeredModals.length);
console.log('Right-Side Modals / Drawers (TARGETS FOR CENTERING):', trueRightDrawers.length);
console.log('Already Centered Modals:', centeredModals.length);
console.log('Components with Heavy Black Backdrops:', heavyBackdropFiles.length);

console.log('\n--- TARGET RIGHT-SIDE DRAWERS / MODALS ---');
trueRightDrawers.forEach((item, i) => {
  console.log(`${i + 1}. [${item.name}] in ${item.file}`);
});
