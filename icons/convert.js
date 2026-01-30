const sharp = require('sharp');
const fs = require('fs');

const sizes = [16, 48, 128];
// 从命令行参数获取输入文件，默认为 icon.svg
const inputFile = process.argv[2] || 'icon.svg';

async function convertIcons() {
  // 检查输入文件是否存在
  if (!fs.existsSync(inputFile)) {
    console.error(`错误: 找不到文件 "${inputFile}"`);
    console.log(`用法: node convert.js <你的图标.svg>`);
    console.log(`示例: node convert.js my-icon.svg`);
    process.exit(1);
  }

  console.log(`正在转换 ${inputFile}...`);

  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(`icon${size}.png`);
    console.log(`✓ Created icon${size}.png`);
  }

  console.log('\n转换完成！已生成 3 个尺寸的图标。');
}

convertIcons().catch(console.error);
