#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises';

const required = [
  'public/index.html',
  'public/styles.css',
  'public/app.js',
  'public/assets/product-clips.svg',
  'public/assets/product-workshop.svg',
  'public/assets/product-travel.svg',
  'public/assets/product-family.svg',
];

for (const file of required) {
  await access(file);
}

const html = await readFile('public/index.html', 'utf8');
const css = await readFile('public/styles.css', 'utf8');
const js = await readFile('public/app.js', 'utf8');

const requiredHtml = ['Cliplot', 'Kategorie', 'Doprava a platba', 'Do košíku', 'Bezpečná platba'];
const requiredCss = ['#FAFAF7', '#2F6B4F', '#8A3A36'];
const requiredJs = ['localStorage', 'renderCart', 'checkoutForm'];

const missing = [
  ...requiredHtml.filter((item) => !html.includes(item)).map((item) => `html:${item}`),
  ...requiredCss.filter((item) => !css.includes(item)).map((item) => `css:${item}`),
  ...requiredJs.filter((item) => !js.includes(item)).map((item) => `js:${item}`),
];

if (missing.length) {
  console.error('STATIC_ASSET_CHECK=fail');
  for (const item of missing) console.error(`MISSING ${item}`);
  process.exit(1);
}

console.log('STATIC_ASSET_CHECK=pass');
