'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'package.json',
  'language-configuration.json',
  'syntaxes/spar.tmLanguage.json',
  '.vscode/launch.json',
  'snippets/spar.json'
];

for (const rel of files) {
  const full = path.join(root, rel);
  const text = fs.readFileSync(full, 'utf8');
  JSON.parse(text);
}

console.log('SPAR VSCode extension validation passed');
