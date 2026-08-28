const fs = require('fs');

// Parse rels to map rId to image file
const relsXml = fs.readFileSync('extracted_images/_rels.xml', 'utf8');
const rels = {};
const relRe = /<Relationship\s+Id="([^"]+)"\s+Type="[^"]*image[^"]*"\s+Target="media\/([^"]+)"/gi;
let m;
while ((m = relRe.exec(relsXml)) !== null) {
  rels[m[1]] = m[2];
}
console.log('图片关系映射:');
Object.entries(rels).forEach(([k, v]) => console.log('  ' + k + ' -> ' + v));
console.log('\n共 ' + Object.keys(rels).length + ' 张图片映射');

// Now parse document.xml to find image references and surrounding text
const docXml = fs.readFileSync('extracted_images/_document.xml', 'utf8');

// Extract paragraphs with their text and image references
// Each paragraph <w:p> contains text <w:t> and images via <a:blip r:embed="rIdX">
const paragraphs = [];
const pRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
let pMatch;
while ((pMatch = pRe.exec(docXml)) !== null) {
  const pXml = pMatch[0];
  
  // Extract all text from this paragraph
  const texts = [];
  const tRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let tMatch;
  while ((tMatch = tRe.exec(pXml)) !== null) {
    texts.push(tMatch[1]);
  }
  const text = texts.join('').trim();
  
  // Extract all image references
  const images = [];
  const imgRe = /<a:blip[^>]*r:embed="([^"]+)"/g;
  let imgMatch;
  while ((imgMatch = imgRe.exec(pXml)) !== null) {
    if (rels[imgMatch[1]]) images.push(rels[imgMatch[1]]);
  }
  
  if (text || images.length > 0) {
    paragraphs.push({ text, images });
  }
}

// Now find which site name is nearest before each image
console.log('\n=== 图片与遗址关联 ===\n');

// Known site names from our JSON
const sites = require('./sites_with_coords.json');
const siteNames = sites.filter(s => !/^\d/.test(s.name) && s.name.length >= 4)
  .map(s => s.name.replace(/[（）()]/g, '').replace(/\s+/g, '')); // normalize

let lastSite = null;
let imageCount = 0;

for (const p of paragraphs) {
  // Check if this paragraph contains a site name
  const normalizedText = p.text.replace(/[（）()]/g, '').replace(/\s+/g, '');
  
  // Check if text matches a known site name (start of text or contains)
  for (const sn of siteNames) {
    if (normalizedText.includes(sn) || sn.includes(normalizedText)) {
      if (normalizedText.length >= 4) {
        lastSite = sn;
        break;
      }
    }
  }
  
  // If this paragraph has images, associate them
  if (p.images.length > 0) {
    imageCount += p.images.length;
    const siteLabel = lastSite || '(未知)';
    console.log(siteLabel + ':');
    p.images.forEach(img => {
      const size = fs.statSync('extracted_images/' + img).size;
      console.log('  └─ ' + img + ' (' + (size / 1024).toFixed(1) + ' KB)');
    });
    console.log('');
  }
}

console.log('\n=== 解析完毕 ===');
console.log('总图片数:', imageCount);
