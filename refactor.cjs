const fs = require('fs');
const path = require('path');

// 1. Replace p-[40px]
const paddingFiles = ['src/pages/Login.tsx', 'src/pages/Register.tsx', 'src/pages/ActivationScreen.tsx'];
paddingFiles.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/p-\[40px\]/g, 'p-6 sm:p-10');
    fs.writeFileSync(f, content);
    console.log(`Updated padding in ${f}`);
  }
});

// 2. Replace text-black/60 in AdminLayout
if (fs.existsSync('src/components/AdminLayout.tsx')) {
  let content = fs.readFileSync('src/components/AdminLayout.tsx', 'utf8');
  content = content.replace(/text-black\/60/g, 'text-text-secondary');
  fs.writeFileSync('src/components/AdminLayout.tsx', content);
  console.log(`Updated text-black/60 in AdminLayout.tsx`);
}

// 3. Add aria-label to icon-only buttons
const buttonRegex = /<button([^>]*)>([\s\S]*?)<\/button>/g;
function addAriaLabel(file, overrides = []) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let match;
  let newContent = content;
  
  // Custom manual replacements for known icon-only buttons
  overrides.forEach(ov => {
    newContent = newContent.replace(ov.find, ov.replace);
  });
  
  fs.writeFileSync(file, newContent);
}

// Layout.tsx
addAriaLabel('src/components/Layout.tsx', [
  {
    find: /<button \n          onClick=\{\(\) => setIsMobileMenuOpen\(true\)\}/g,
    replace: '<button aria-label="Open menu"\n          onClick={() => setIsMobileMenuOpen(true)}'
  },
  {
    find: /<button \n              onClick=\{\(\) => setIsMobileMenuOpen\(false\)\}/g,
    replace: '<button aria-label="Close menu"\n              onClick={() => setIsMobileMenuOpen(false)}'
  },
  {
    find: /<button \n            onClick=\{handleSignOut\}/g,
    replace: '<button aria-label="Sign out"\n            onClick={handleSignOut}'
  }
]);

// AdminLayout.tsx
addAriaLabel('src/components/AdminLayout.tsx', [
  {
    find: /<button \n          onClick=\{\(\) => setIsMobileMenuOpen\(true\)\}/g,
    replace: '<button aria-label="Open menu"\n          onClick={() => setIsMobileMenuOpen(true)}'
  },
  {
    find: /<button \n              onClick=\{\(\) => setIsMobileMenuOpen\(false\)\}/g,
    replace: '<button aria-label="Close menu"\n              onClick={() => setIsMobileMenuOpen(false)}'
  },
  {
    find: /<button \n            onClick=\{handleSignOut\}/g,
    replace: '<button aria-label="Sign out"\n            onClick={handleSignOut}'
  }
]);

// AdminDashboard.tsx
addAriaLabel('src/pages/AdminDashboard.tsx', [
  {
    find: /<button onClick=\{fetchPGs\}/g,
    replace: '<button aria-label="Refresh workspaces" onClick={fetchPGs}'
  }
]);

// Maintenance.tsx
addAriaLabel('src/pages/Maintenance.tsx', [
  {
    find: /<button \n            onClick=\{\(\) => setShowAddSheet\(true\)\}/g,
    replace: '<button aria-label="Add ticket"\n            onClick={() => setShowAddSheet(true)}'
  },
  {
    find: /<button \n                onClick=\{\(\) => setShowAddSheet\(false\)\}/g,
    replace: '<button aria-label="Close add ticket sheet"\n                onClick={() => setShowAddSheet(false)}'
  }
]);

// TenantDetail.tsx
addAriaLabel('src/pages/TenantDetail.tsx', [
  {
    find: /<button onClick=\{\(\) => navigate\(-1\)\}/g,
    replace: '<button aria-label="Go back" onClick={() => navigate(-1)}'
  },
  {
    find: /<button onClick=\{\(\) => setShowMoveOutSheet\(false\)\}/g,
    replace: '<button aria-label="Close move out sheet" onClick={() => setShowMoveOutSheet(false)}'
  },
  {
    find: /<button onClick=\{\(\) => setShowEditModal\(false\)\}/g,
    replace: '<button aria-label="Close edit modal" onClick={() => setShowEditModal(false)}'
  }
]);

console.log('Finished refactoring scripts.');
