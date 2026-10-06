import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgBuffer = fs.readFileSync('public/icons/favicon.svg');

async function generate() {
  await sharp(svgBuffer)
    .resize(192, 192)
    .toFile('public/icons/icon-192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .toFile('public/icons/icon-512.png');

  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51, bottom: 51, left: 51, right: 51,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile('public/icons/icon-maskable-512.png');

  await sharp(svgBuffer)
    .resize(180, 180)
    .toFile('public/icons/apple-touch-icon.png');
    
  console.log('Icons generated successfully.');
}

generate().catch(console.error);
