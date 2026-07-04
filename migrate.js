const fs = require('fs');
const path = require('path');

const directory = './'; // Run in frontend root

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

  // Replace background and border classes
  content = content.replace(/bg-dark-card/g, 'bg-card');
  content = content.replace(/bg-dark-bg/g, 'bg-background');
  content = content.replace(/border-dark-border/g, 'border-border');

  // Replace text colors carefully
  content = content.replace(/text-gray-300/g, 'text-muted-foreground');
  content = content.replace(/text-gray-400/g, 'text-muted-foreground');
  
  // Replace text-white with text-foreground, EXCEPT if the class string contains button colors
  content = content.replace(/className=(["'{`])(.*?)\1/g, (match, quote, classes) => {
    if (classes.includes('bg-emerald') || 
        classes.includes('bg-cyan') || 
        classes.includes('bg-primary') ||
        classes.includes('bg-gradient') ||
        classes.includes('btn-') ||
        classes.includes('bg-red') ||
        classes.includes('bg-[#1E7F4D]') ||
        classes.includes('bg-amber')) {
      return match;
    }
    
    let newClasses = classes.replace(/\btext-white\b/g, 'text-foreground');
    return `className=${quote}${newClasses}${quote}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    modifiedFiles++;
  }
});

console.log(`Migration complete. Modified ${modifiedFiles} files.`);
