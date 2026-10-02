#!/usr/bin/env node
/**
 * Renders the raster brand assets in public/ from public/favicon.svg:
 * apple-touch-icon.png (180), logo-512.png (JSON-LD logo), favicon.ico (32px PNG-in-ICO)
 * and og-default.jpg (1200×630 social card). Run after changing the logo or tagline.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const pub = path.resolve(import.meta.dirname, '../public');
const mark = readFileSync(path.join(pub, 'favicon.svg'));

await sharp(mark, { density: 300 }).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'));
await sharp(mark, { density: 300 }).resize(512, 512).png().toFile(path.join(pub, 'logo-512.png'));

// ICO container with a single 32×32 PNG image.
const png32 = await sharp(mark, { density: 300 }).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([header, png32]));

const inner = mark.toString().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#fbfaf7"/>
  <rect x="0" y="0" width="1200" height="8" fill="#15b27a"/>
  <svg x="80" y="84" width="88" height="88" viewBox="0 0 375 375">${inner}</svg>
  <text x="188" y="146" font-family="Helvetica Neue, Arial, sans-serif" font-size="52" font-weight="700" fill="#0a0a0a" letter-spacing="-2">uppush</text>
  <text x="80" y="330" font-family="Helvetica Neue, Arial, sans-serif" font-size="72" font-weight="700" fill="#0a0a0a" letter-spacing="-2.5">Recover more sales with</text>
  <text x="80" y="414" font-family="Helvetica Neue, Arial, sans-serif" font-size="72" font-weight="700" fill="#0a0a0a" letter-spacing="-2.5">email &amp; web push for <tspan fill="#0b7a52">Shopify</tspan></text>
  <text x="80" y="520" font-family="Helvetica Neue, Arial, sans-serif" font-size="30" fill="#5c5c63">Free plan · Unlimited subscribers · Pay as you send</text>
  <circle cx="1080" cy="510" r="10" fill="#15b27a"/>
</svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile(path.join(pub, 'og-default.jpg'));
console.log('Brand images written to public/');
