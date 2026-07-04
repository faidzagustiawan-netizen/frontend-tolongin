const fs = require('fs');
const path = require('path');

const directory = './'; 

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !dirPath.includes('node_modules') && !dirPath.includes('.next') && !dirPath.includes('.git')) {
      walk(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(path.join(dirPath));
    }
  });
}

let modifiedFiles = 0;

walk(directory, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace bad hovers
  content = content.replace(/hover:text-white/g, 'hover:text-foreground');
  content = content.replace(/text-gray-500/g, 'text-muted-foreground');
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-foreground/5');
  content = content.replace(/bg-white\/5/g, 'bg-foreground/5');
  content = content.replace(/bg-white\/10/g, 'bg-foreground/10');
  content = content.replace(/border-white\/10/g, 'border-foreground/10');
  content = content.replace(/border-white\/20/g, 'border-foreground/20');

  // Fix some edge cases where text-white was missed in normal body text (not in buttons)
  // Look for text-white not near bg-emerald, from-emerald, bg-red, btn- etc
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    modifiedFiles++;
  }
});

console.log(`Migration 2 complete. Modified ${modifiedFiles} files.`);
