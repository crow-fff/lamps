#!/usr/bin/env node

/**
 * Patch rolldown for Node.js compatibility
 * Fixes the issue where styleText from node:util is not available in Node.js < 21.7.0
 */

const fs = require('fs');
const path = require('path');

const patchFile = path.join(
  __dirname,
  'node_modules/rolldown/dist/shared/create-bundler-option-wRiQzEJ3.mjs'
);

if (!fs.existsSync(patchFile)) {
  console.warn(`Warning: Patch file not found at ${patchFile}`);
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

// Match: import { formatWithOptions, styleText } from "node:util";
// Replace with: import { formatWithOptions } from "node:util";
// Then add a fallback: let styleText = (s) => s;

const hasMatch = content.includes('import { formatWithOptions, styleText } from "node:util"');
if (hasMatch) {
  content = content.replace(
    'import { formatWithOptions, styleText } from "node:util"',
    'import { formatWithOptions } from "node:util"'
  );
  
  // Add fallback by injecting after the imports
  // Find the first import line and insert after all imports
  const firstFunctionMatch = content.match(/^function\s/m);
  if (firstFunctionMatch) {
    const insertPos = content.indexOf(firstFunctionMatch[0]);
    content = content.slice(0, insertPos) + 
      'let styleText = (s) => s; // PATCHED_FOR_NODEJS_COMPAT: fallback for Node.js < 21.7.0\n' +
      content.slice(insertPos);
  } else {
    // Fallback: add at end of imports
    const lastImportPos = content.lastIndexOf('\nimport ');
    const eolPos = content.indexOf('\n', lastImportPos + 1);
    content = content.slice(0, eolPos) + 
      '\nlet styleText = (s) => s; // PATCHED_FOR_NODEJS_COMPAT: fallback for Node.js < 21.7.0' +
      content.slice(eolPos);
  }
  
  fs.writeFileSync(patchFile, content, 'utf-8');
  console.log('✓ Successfully patched rolldown for Node.js compatibility');
} else {
  console.warn('Warning: Expected import statement not found - the file may have already changed');
}



