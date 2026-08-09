/* Verifies every locale dictionary mirrors en.js exactly: same keys, same
   array lengths, same tuple shapes, strings everywhere en has strings.
   Run from web/:  node scripts/i18n-check.mjs        (exit 1 on any drift) */
import en from '../src/i18n/en.js';

const LOCALES = ['te', 'hi', 'ta', 'kn'];
let failures = 0;

function walk(base, other, path, report) {
  if (typeof base === 'string') {
    if (typeof other !== 'string') report(`${path}: expected a string, got ${other === undefined ? 'nothing' : typeof other}`);
    else if (!other.trim()) report(`${path}: empty string`);
    return;
  }
  if (Array.isArray(base)) {
    if (!Array.isArray(other)) return report(`${path}: expected an array`);
    if (other.length !== base.length) return report(`${path}: has ${other.length} items, en has ${base.length}`);
    base.forEach((v, i) => walk(v, other[i], `${path}[${i}]`, report));
    return;
  }
  if (typeof other !== 'object' || other === null) return report(`${path}: expected an object`);
  for (const k of Object.keys(base)) {
    if (!(k in other)) report(`${path}.${k}: missing`);
    else walk(base[k], other[k], `${path}.${k}`, report);
  }
  for (const k of Object.keys(other)) {
    if (!(k in base)) report(`${path}.${k}: extra key not present in en`);
  }
}

for (const code of LOCALES) {
  const dict = (await import(`../src/i18n/${code}.js`)).default;
  const problems = [];
  walk(en, dict, code, msg => problems.push(msg));
  if (problems.length) {
    failures += problems.length;
    console.error(`✗ ${code}.js — ${problems.length} problem(s):`);
    problems.forEach(p => console.error(`   ${p}`));
  } else {
    console.log(`✓ ${code}.js mirrors en.js`);
  }
}

if (failures) {
  console.error(`\n${failures} problem(s). Every locale must mirror en.js exactly.`);
  process.exit(1);
}
console.log('\nAll locales in sync.');
