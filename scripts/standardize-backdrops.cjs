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

files.forEach(f => {
  const base = path.basename(f);
  // Skip non-modals
  if (/OfflineBanner|EnrollmentCaptureWizard|FaceEnrollPage/.test(base)) return;
  if (/^(Sidebar|Navbar|Header|AppLayout|Layout)\.jsx$/.test(base)) return;

  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Replace dark 40%, 50%, 60% backdrops with ultra-subtle, transparent 15% backdrop
  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-slate-900\/40\s+backdrop-blur-(?:sm|xs)([^"'>]*)/g,
    '$1bg-black/15 backdrop-blur-xs$2'
  );

  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-slate-900\/(?:50|60)\s+backdrop-blur-(?:sm|xs)([^"'>]*)/g,
    '$1bg-black/15 backdrop-blur-xs$2'
  );

  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-slate-950\/(?:40|50|60)\s+backdrop-blur-(?:sm|xs)([^"'>]*)/g,
    '$1bg-black/15 backdrop-blur-xs$2'
  );

  content = content.replace(
    /(fixed\s+inset-0[^"'>]*\b)bg-black\/(?:40|50|60)\s+backdrop-blur-(?:sm|xs)([^"'>]*)/g,
    '$1bg-black/15 backdrop-blur-xs$2'
  );

  // Upgrade modal z-index from z-50 or z-40 to z-[100] to prevent topbar / sidebar clipping
  // Only where fixed inset-0 is present and it is a modal/dialog
  content = content.replace(
    /(fixed\s+inset-0\s+)z-(?:40|50)(\s+)/g,
    '$1z-[100]$2'
  );

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    changedFilesCount++;
    console.log(`Subtle Backdrop Applied: ${path.relative('.', f)}`);
  }
});

console.log(`\nUltra-Subtle Transparent Backdrop Applied to ${changedFilesCount} files.`);
