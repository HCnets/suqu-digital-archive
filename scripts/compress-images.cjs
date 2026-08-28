const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_DIR = path.resolve(__dirname, '../server/public/images/archives');
const BACKUP_DIR = path.join(IMG_DIR, 'backup_originals');

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const files = fs.readdirSync(IMG_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

let totalBefore = 0, totalAfter = 0;

async function compress() {
  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    const stat = fs.statSync(filePath);
    const sizeKB = Math.round(stat.size / 1024);
    
    // Skip already small files
    if (sizeKB < 100) {
      console.log(`  SKIP ${file} (${sizeKB}KB, already small)`);
      continue;
    }

    totalBefore += stat.size;
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const isPng = ext === '.png';
    
    try {
      let pipeline = sharp(filePath).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true });
      
      let outFile, outData;
      if (isPng) {
        // Convert PNG photos to JPEG
        outFile = path.join(IMG_DIR, baseName + '.jpg');
        outData = await pipeline.jpeg({ quality: 80 }).toBuffer();
      } else {
        outFile = filePath;
        outData = await pipeline.jpeg({ quality: 80 }).toBuffer();
      }
      
      // Backup original
      fs.copyFileSync(filePath, path.join(BACKUP_DIR, file));
      
      // Write compressed
      fs.writeFileSync(outFile, outData);
      
      // If PNG→JPEG, remove the big PNG
      if (isPng && outFile !== filePath) {
        fs.unlinkSync(filePath);
      }
      
      const newSize = Math.round(outData.length / 1024);
      totalAfter += outData.length;
      console.log(`  OK  ${file} → ${path.basename(outFile)}  ${sizeKB}KB → ${newSize}KB (${Math.round((1 - newSize/sizeKB)*100)}% off)`);
    } catch (err) {
      console.error(`  ERR ${file}: ${err.message}`);
    }
  }
  
  const beforeMB = (totalBefore / 1024 / 1024).toFixed(1);
  const afterMB = (totalAfter / 1024 / 1024).toFixed(1);
  console.log(`\n=== 压缩完成 ===`);
  console.log(`总大小: ${beforeMB}MB → ${afterMB}MB`);
}

compress();
