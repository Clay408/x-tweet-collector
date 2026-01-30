const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 48, 128];

async function convertIcons() {
  for (const size of sizes) {
    await sharp('icon.svg')
      .resize(size, size)
      .png()
      .toFile(`icon${size}.png`);
    console.log(`Created icon${size}.png`);
  }
}

convertIcons().catch(console.error);
