const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/Tolongin/frontend/**/*.{tsx,ts}', { ignore: '**/node_modules/**' });
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // Replace /dashboard/company, /dashboard/talent, /dashboard/settings
  newContent = newContent.replace(/\/dashboard\/company\//g, '/company/');
  newContent = newContent.replace(/\/dashboard\/talent\//g, '/talent/');
  newContent = newContent.replace(/\/dashboard\/settings\//g, '/settings/');

  // Fix challenge.id to challenge.slug where appropriate
  if (file.endsWith('sitemap.ts')) {
    newContent = newContent.replace(/\$\{baseUrl\}\/challenges\/\$\{challenge\.id\}/g, '${baseUrl}/challenges/${challenge.slug}');
  }
  
  if (file.includes('workspace') && file.endsWith('page.tsx')) {
    newContent = newContent.replace(/\/challenges\/\$\{selectedEnrollment\.challenge\.id\}/g, '/challenges/${selectedEnrollment.challenge.slug}');
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
    changedFiles++;
  }
}

console.log('Total files changed:', changedFiles);
