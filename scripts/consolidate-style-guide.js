const fs = require('fs');
const path = require('path');

const styleGuideDir = path.join(__dirname, '..', 'apex-style-guide');
const outputFile = path.join(__dirname, 'consolidated-style-guide.txt');

function readAllFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(readAllFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

const allFiles = readAllFiles(styleGuideDir);
let output = '';

for (const file of allFiles) {
  const relativePath = path.relative(styleGuideDir, file);
  const content = fs.readFileSync(file, 'utf8');
  
  output += `\n${'='.repeat(80)}\n`;
  output += `FILE: ${relativePath}\n`;
  output += `${'='.repeat(80)}\n\n`;
  output += content + '\n\n';
}

fs.writeFileSync(outputFile, output);
console.log(`✅ Done! Created: ${outputFile}`);
console.log(`📄 Consolidated ${allFiles.length} files from apex-style-guide`);