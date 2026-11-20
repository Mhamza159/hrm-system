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
let changedFilesCount = 0;
let totalReplacements = 0;

files.forEach(f => {
  const base = path.basename(f);
  // Do not touch non-modal files like camera feeds / pill badges
  if (/OfflineBanner|EnrollmentCaptureWizard|FaceEnrollPage/.test(base)) return;

  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Pattern 1: `bg-black/(60|70|75|80) backdrop-blur-(xs|sm|md)` inside a fixed overlay
  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-black\/(?:60|70|75|80)\s+backdrop-blur-(?:xs|sm|md)([^"'>]*)/g,
    '$1bg-slate-900/40 backdrop-blur-sm$2'
  );

  // Pattern 2: `bg-slate-950/(?:60|70|75|80)\s+backdrop-blur-(?:xs|sm|md)` inside a fixed overlay
  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-slate-950\/(?:60|70|75|80)\s+backdrop-blur-(?:xs|sm|md)([^"'>]*)/g,
    '$1bg-slate-900/40 backdrop-blur-sm$2'
  );

  // Pattern 3: `bg-slate-900/(?:60|70|80)\s+backdrop-blur-(?:xs|sm|md)` inside a fixed overlay
  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-slate-900\/(?:60|70|80)\s+backdrop-blur-(?:xs|sm|md)([^"'>]*)/g,
    '$1bg-slate-900/40 backdrop-blur-sm$2'
  );

  // Pattern 4: in backdrop child div e.g. `<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs ..."`
  content = content.replace(
    /(className=["'][^"']*fixed\s+inset-0[^"']*?\b)bg-(?:black|slate-950|slate-900)\/(?:60|70|75|80)\s+backdrop-blur-(?:xs|sm|md)([^"']*["'])/g,
    '$1bg-slate-900/40 backdrop-blur-sm$2'
  );

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changedFilesCount++;
    console.log(`Updated backdrop in: ${path.relative('.', f)}`);
  }
});

console.log(`\nStandardization Complete: Updated ${changedFilesCount} files.`);
