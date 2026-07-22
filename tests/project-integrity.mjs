import { existsSync, readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const html = readFileSync('index.html', 'utf8');
const script = readFileSync('script.js', 'utf8');

assert(html.includes('styles.css'), 'index.html must load styles.css');
assert(html.includes('script.js'), 'index.html must load script.js');
assert(existsSync('styles.css') && existsSync('script.js'), 'Referenced static assets must exist');

const referencedIds = [...script.matchAll(/getElementById\(["']([^"']+)["']\)/g)].map((match) => match[1]);
for (const id of new Set(referencedIds)) {
  assert(html.includes(`id="${id}"`) || html.includes(`id='${id}'`), `Missing HTML element #${id}`);
}

console.log(`Static integrity check passed for ${new Set(referencedIds).size} referenced elements.`);
