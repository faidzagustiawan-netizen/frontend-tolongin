const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/Tolongin/frontend/**/*.{tsx,ts}', { ignore: '**/node_modules/**' });
let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/router\.push\(['"]\/dashboard['"]\)/g, "router.push('/')");
  newContent = newContent.replace(/router\.push\(['"]\/profile['"]\)/g, "router.push('/settings')");
  newContent = newContent.replace(/href=['"]\/dashboard['"]/g, "href=\"/\"");
  newContent = newContent.replace(/href=['"]\/profile['"]/g, "href=\"/settings\"");
  
  // also fix href={`/challenges/${selectedEnrollment.challenge.id}`} if any is left
  newContent = newContent.replace(/href=\{\`\/challenges\/\$\{([a-zA-Z0-9_.]+)\.id\}\`\}/g, "href={`/challenges/${$1.slug}`}");
  
  // fix /challenges/create?id=uuid
  // the user probably means "the edit challenge link points to /challenges/create?id=... instead of slug"
  // but editing by ID is normal!
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
    changed++;
  }
}
console.log('Total fixed:', changed);
