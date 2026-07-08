const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace dark: classes
  content = content.replace(/dark:[a-z0-9\-\/\[\]]+/g, '');

  // Replace amber colors
  content = content.replace(/bg-amber-50\b/g, 'bg-primary/5');
  content = content.replace(/bg-amber-100\b/g, 'bg-primary/10');
  content = content.replace(/text-amber-100\b/g, 'text-primary/10');
  content = content.replace(/text-amber-200\b/g, 'text-primary/20');
  content = content.replace(/text-amber-300\b/g, 'text-primary');
  content = content.replace(/text-amber-400\b/g, 'text-primary');
  content = content.replace(/text-amber-500\b/g, 'text-primary');
  content = content.replace(/text-amber-600\b/g, 'text-primary');
  content = content.replace(/text-amber-700\b/g, 'text-primary');
  content = content.replace(/text-amber-800\b/g, 'text-primary');
  content = content.replace(/text-amber-900\b/g, 'text-primary');
  
  content = content.replace(/border-amber-100\b/g, 'border-primary/10');
  content = content.replace(/border-amber-200\b/g, 'border-primary/20');
  content = content.replace(/border-amber-300\b/g, 'border-primary/30');
  content = content.replace(/border-amber-400\b/g, 'border-primary/40');
  content = content.replace(/border-amber-500\b/g, 'border-primary');
  content = content.replace(/border-amber-600\b/g, 'border-primary');
  
  content = content.replace(/bg-amber-400\b/g, 'bg-primary');
  content = content.replace(/bg-amber-500\b/g, 'bg-primary');
  content = content.replace(/bg-amber-600\b/g, 'bg-primary hover:bg-primary/90');
  content = content.replace(/bg-amber-700\b/g, 'bg-primary hover:bg-primary/90');

  content = content.replace(/shadow-amber-500\/[0-9]+/g, 'shadow-primary/20');
  content = content.replace(/from-amber-500/g, 'from-primary');
  content = content.replace(/to-orange-500/g, 'to-primary');
  content = content.replace(/to-orange-600/g, 'to-primary');
  content = content.replace(/hover:to-orange-700/g, 'hover:to-primary');
  content = content.replace(/hover:from-amber-600/g, 'hover:from-primary');

  // Replace text-zinc-900 dark:text-white logic
  // Since we removed dark:, double spaces might be left
  content = content.replace(/  +/g, ' ');
  content = content.replace(/ className=" /g, ' className="');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDirectory(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceColorsInFile(fullPath);
    }
  });
}

traverseDirectory(directoryPath);
console.log('Done.');
