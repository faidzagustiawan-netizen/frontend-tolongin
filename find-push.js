const fs = require('fs');
const glob = require('glob');

const files = glob.sync('d:/Tolongin/frontend/**/*.{tsx,ts}', { ignore: '**/node_modules/**' });

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const matches = content.match(/push\(?\`\/challenges\/[^`]*\`\)?/g);
  if (matches) {
    console.log(file, matches);
  }
}
