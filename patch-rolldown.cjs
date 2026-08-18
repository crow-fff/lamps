#!/usr/bin/env node

/**
 * Patch rolldown for Node.js compatibility
 * Fixes the issue where styleText from node:util is not available in Node.js < 21.7.0
 */

const fs = require('fs');
const path = require('path');

const sharedDir = path.join(__dirname, 'node_modules/rolldown/dist/shared');
if (!fs.existsSync(sharedDir)) {
  console.warn(`Warning: Rolldown shared directory not found at ${sharedDir}`);
  process.exit(0);
}

const patchFile = fs.readdirSync(sharedDir)
  .filter((file) => /^create-bundler-option-.*\.mjs$/.test(file))
  .map((file) => path.join(sharedDir, file))
  .find((file) => fs.readFileSync(file, 'utf-8').includes('styleText'));

if (!patchFile) {
  console.warn('Warning: Rolldown bundle with styleText import not found');
  process.exit(0);
}

let content = fs.readFileSync(patchFile, 'utf-8');

// Check if already patched
if (content.includes('PATCHED_FOR_NODEJS_COMPAT')) {
  console.log('Rolldown already patched, skipping...');
  process.exit(0);
}

// Simply remove styleText from the import and add a fallback
// This is the simplest and most robust approach

// Match the named import regardless of quote style or specifier ordering.
const importPattern = /import\s*\{\s*([^}]*\bstyleText\b[^}]*)\}\s*from\s*(['"])node:util\2\s*;?/;
const importMatch = content.match(importPattern);
const hasMatch = Boolean(importMatch);
if (hasMatch) {
  const specifiers = importMatch[1]
    .split(',')
    .map((specifier) => specifier.trim())
    .filter((specifier) => specifier !== 'styleText')
    .join(', ');
  content = content.replace(importPattern, `import { ${specifiers} } from "node:util";`);
  
  // Add fallback by injecting after the imports
  // Find the first import line and insert after all imports
  const firstFunctionMatch = content.match(/^function\s/m);
  if (firstFunctionMatch) {
    const insertPos = content.indexOf(firstFunctionMatch[0]);
    content = content.slice(0, insertPos) + 
      'const styleText = (...args) => args.at(-1); // PATCHED_FOR_NODEJS_COMPAT: fallback for Node.js < 21.7.0\n' +
      content.slice(insertPos);
  } else {
    // Fallback: add at end of imports
    const lastImportPos = content.lastIndexOf('\nimport ');
    const eolPos = content.indexOf('\n', lastImportPos + 1);
    content = content.slice(0, eolPos) + 
      '\nconst styleText = (...args) => args.at(-1); // PATCHED_FOR_NODEJS_COMPAT: fallback for Node.js < 21.7.0' +
      content.slice(eolPos);
  }
  
  fs.writeFileSync(patchFile, content, 'utf-8');
  console.log('✓ Successfully patched rolldown for Node.js compatibility');
} else {
  console.warn('Warning: Expected import statement not found - the file may have already changed');
}


