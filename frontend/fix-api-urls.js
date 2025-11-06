/**
 * Script to replace hardcoded localhost:8000 URLs with environment-aware API calls
 * Run with: node fix-api-urls.js
 */

const fs = require('fs');
const path = require('path');

// Directories to search
const searchDirs = ['app', 'components', 'lib'];

// Pattern to find: fetch("${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/...
const pattern = /fetch\(\s*["'](http:\/\/localhost:8000\/api\/v1[^"']*)["']/g;

let filesModified = 0;
let totalReplacements = 0;

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacements = 0;
  
  // Check if file needs the import
  const needsImport = pattern.test(content);
  
  if (!needsImport) return;
  
  // Reset regex
  pattern.lastIndex = 0;
  
  let newContent = content;
  
  // Add import if not already present
  if (!content.includes('from "@/lib/api/fetch-helper"') && !content.includes("from '@/lib/api/fetch-helper'")) {
    // Find the last import statement
    const importRegex = /^import .* from .*$/gm;
    const imports = content.match(importRegex);
    
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      newContent = content.slice(0, insertPosition) + 
                   '\nimport { apiFetch } from "@/lib/api/fetch-helper"' +
                   content.slice(insertPosition);
      modified = true;
    }
  }
  
  // Replace fetch calls
  newContent = newContent.replace(
    /fetch\(\s*["'](http:\/\/localhost:8000\/api\/v1([^"']*))['"]/g,
    (match, fullUrl, endpoint) => {
      replacements++;
      return `apiFetch("${endpoint}"`;
    }
  );
  
  if (replacements > 0) {
    modified = true;
    totalReplacements += replacements;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    console.log(`✅ Fixed ${filePath} (${replacements} replacements)`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('🔍 Searching for hardcoded API URLs...\n');

searchDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    walkDir(fullPath);
  }
});

console.log(`\n✨ Done! Modified ${filesModified} files with ${totalReplacements} replacements.`);
