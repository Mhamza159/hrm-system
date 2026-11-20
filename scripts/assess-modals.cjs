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

const issues = {
  rightDockedFound: [],
  missingStopPropagation: [],
  missingMaxHeightOrOverflow: [],
  doubleBackdropFound: [],
  heavyBackdropRemaining: []
};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const base = path.basename(f);
  if (/^(Sidebar|Navbar|Header|AppLayout|Layout)\.jsx$/.test(base)) return;
  if (/NetworkProgressBar|OfflineBanner|EnrollmentCaptureWizard|FaceEnrollPage/.test(base)) return;

  const isModal = /Modal|Drawer|Dialog|Sheet/.test(base) || (content.includes('fixed inset-0') && (content.includes('role="dialog"') || content.includes('aria-modal') || content.includes('onClose')));
  if (!isModal) return;

  const rel = path.relative('.', f).replace(/\\/g, '/');

  // Check 1: Right-docked container
  if (
    /fixed\s+inset-0[^"'>]*\bjustify-end\b/.test(content) ||
    /fixed\s+[^"'>]*\bjustify-end\b[^"'>]*inset-0/.test(content) ||
    /fixed\s+[^"'>]*\binset-y-0\s+right-0\b/.test(content) ||
    /slide-in-from-right/.test(content)
  ) {
    issues.rightDockedFound.push(rel);
  }

  // Check 2: Missing stopPropagation on inner card when outer has onClick={onClose}
  if (content.includes('onClick={onClose}') || content.includes('onClick={() => onClose()}')) {
    const hasStopPropagation = content.includes('stopPropagation');
    const hasBackdropDismissDiv = /onClick=\{onClose\}[^>]*aria-hidden/.test(content) || /fixed inset-0.*onClick=\{onClose\}/.test(content);
    if (!hasStopPropagation && !hasBackdropDismissDiv) {
      issues.missingStopPropagation.push(rel);
    }
  }

  // Check 3: Modal container missing max-h or overflow handling on large forms (>5000 bytes)
  if (content.includes('role="dialog"') || /Modal\.jsx$/.test(base)) {
    const hasMaxH = /max-h-/.test(content) || /overflow-y-auto/.test(content);
    if (!hasMaxH && content.length > 5000) {
      issues.missingMaxHeightOrOverflow.push(rel);
    }
  }

  // Check 4: Heavy backdrop remaining
  if (
    (/bg-black\/(?:70|75|80|85|90|95|100)/.test(content) && content.includes('fixed inset-0')) ||
    (/bg-slate-950\/(?:70|75|80|85|90|95|100)/.test(content) && content.includes('fixed inset-0'))
  ) {
    issues.heavyBackdropRemaining.push(rel);
  }

  // Check 5: Double backdrop overlay layers
  const backdropMatches = (content.match(/fixed\s+inset-0[^"'>]*bg-/g) || []).length;
  if (backdropMatches > 1) {
    issues.doubleBackdropFound.push(rel);
  }
});

console.log('=== AUDIT FOR ERRORS & EDGE CASES ===');
console.log('Right-Docked Containers Found:', issues.rightDockedFound.length);
issues.rightDockedFound.forEach(x => console.log('  RIGHT:', x));

console.log('\nHeavy Backdrops Remaining:', issues.heavyBackdropRemaining.length);
issues.heavyBackdropRemaining.forEach(x => console.log('  HEAVY:', x));

console.log('\nDouble Backdrop Overlays Found:', issues.doubleBackdropFound.length);
issues.doubleBackdropFound.forEach(x => console.log('  DOUBLE:', x));

console.log('\nMissing stopPropagation Potential Candidates:', issues.missingStopPropagation.length);
issues.missingStopPropagation.forEach(x => console.log('  NO_STOP_PROPAGATION:', x));

console.log('\nLarge Modals Missing max-h/overflow:', issues.missingMaxHeightOrOverflow.length);
issues.missingMaxHeightOrOverflow.forEach(x => console.log('  NO_MAX_H:', x));
