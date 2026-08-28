const fs = require('fs');
const path = require('path');
const sites = require('./sites_with_coords.json');

// ====== Image to Site Mapping (from DOCX XML analysis) ======
const imageMap = [
  { file: 'image1.jpeg', site: null, caption: '封面/扉页图片' },
  { file: 'image2.jpeg', site: '东江独立师指挥部旧址' },
  { file: 'image3.jpeg', site: '海陆紫苏维埃政府旧址' },
  { file: 'image4.jpeg', site: '油谷坑战斗遗址' },
  { file: 'image5.jpeg', site: '朱炎烈士殉难处' },
  { file: 'image6.jpeg', site: '缪冠儒烈士纪念碑' },
  { file: 'image7.jpeg', site: '红军兵工厂旧址' },
  { file: 'image8.jpeg', site: '红军号兵训练所旧址' },
  { file: 'image9.jpeg', site: '红二师官兵操练遗址' },
  { file: 'image10.jpeg', site: '红六军四十九团团部旧址' },
  { file: 'image11.png', site: '龙炮区联队队部旧址' },
  { file: 'image12.jpeg', site: '龙炮区联队队部旧址' },
  { file: 'image13.jpeg', site: '龙炮区联队队部旧址' },
  { file: 'image14.jpeg', site: '战壕遗址' },
  { file: 'image15.jpeg', site: '战壕遗址' },
  { file: 'image16.jpeg', site: '张子玉烈士纪念碑' },
  { file: 'image17.jpeg', site: '张子玉烈士纪念碑', compress: true },
  { file: 'image18.jpeg', site: '中国工农革命军第二师师部旧址' },
  { file: 'image19.jpeg', site: '红四师第十团开会遗址' },
  { file: 'image20.jpeg', site: '钟一朋烈士纪念碑' },
  { file: 'image21.jpeg', site: '紫金县老苏区革命烈士纪念堂', compress: true },
  { file: 'image22.jpeg', site: '紫金县老苏区革命烈士纪念堂' },
  { file: 'image23.png', site: '红二\u3001四师联合公审大会遗址' }, // 红二、四师
  { file: 'image24.png', site: '炮子农民自卫队队部遗址' },
  { file: 'image25.png', site: '洋磜反\u201c围剿\u201d战斗遗址' }, // 洋磜反"围剿"战斗遗址
  { file: 'image26.jpeg', site: '洋磜会师遗址' },
  { file: 'image27.jpeg', site: '云谭村农会旧址' },
  { file: 'image28.png', site: '张子玉故居' },
  { file: 'image29.png', site: '张子玉故居' },
  { file: 'image30.jpeg', site: '张子玉故居' },
  { file: 'image31.jpeg', site: '青溪保卫战旧（遗）址群' },
  { file: 'image32.png', site: '青溪乡农会遗址' },
  { file: 'image33.jpeg', site: '务德楼战斗旧址' },
  { file: 'image34.png', site: '钟定香故居' },
  { file: 'image35.png', site: '钟定香故居' },
  { file: 'image36.png', site: '钟定香故居' },
  { file: 'image37.png', site: '钟定香故居' },
  { file: 'image38.jpeg', site: '钟定香故居' },
  { file: 'image39.png', site: '钟定香故居' },
  { file: 'image40.jpeg', site: '朱豹烈士墓' },
  { file: 'image41.jpeg', site: '朱乙\u3001朱豹烈士纪念碑' }, // 朱乙、朱豹
];

// ====== Generate safe English filename ======
function toFilename(name) {
  // Remove special chars, convert to pinyin-like slug
  let s = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  // Map some common names to recognizable English
  const nameMap = {
    '东江独立师指挥部旧址': 'dongjiang-independent-division-hq',
    '海陆紫苏维埃政府旧址': 'hailuzi-soviet-government',
    '油谷坑战斗遗址': 'yougukeng-battle',
    '朱炎烈士殉难处': 'zhuyan-martyr-shrine',
    '缪冠儒烈士纪念碑': 'miaoguanru-martyr-monument',
    '红军兵工厂旧址': 'red-army-arsenal',
    '红军号兵训练所旧址': 'red-army-bugler-training',
    '红二师官兵操练遗址': 'red-second-division-drill',
    '红六军四十九团团部旧址': 'red-49th-regiment-hq',
    '龙炮区联队队部旧址': 'longpao-district-union-hq',
    '炮子乡农会旧址': 'paozi-farmers-association',
    '战壕遗址': 'trench-site',
    '张子玉烈士纪念碑': 'zhangziyu-martyr-monument',
    '中国工农革命军第二师师部旧址': 'red-second-division-hq',
    '红四师第十团开会遗址': 'red-fourth-division-10th-regiment',
    '钟一朋烈士纪念碑': 'zhongyipeng-martyr-monument',
    '紫金县老苏区革命烈士纪念堂': 'zijin-old-suqu-martyrs-memorial',
    '炮子农民自卫队队部遗址': 'paozi-peasant-selfdefense-hq',
    '洋磜会师遗址': 'yangqi-joining-forces',
    '云谭村农会旧址': 'yuntan-farmers-association',
    '张子玉故居': 'zhangziyu-former-residence',
    '务德楼战斗旧址': 'wude-building-battle',
    '钟定香故居': 'zhongdingxiang-former-residence',
    '朱豹烈士墓': 'zhubao-martyr-tomb',
    '青溪乡农会遗址': 'qingxi-farmers-association',
  };
  // Also try matching cleaned name (without special chars) 
  const cleanedMap = {
    '洋磜反-围剿-战斗遗址': 'yangqi-anti-encirclement',
    '洋磜反围剿战斗遗址': 'yangqi-anti-encirclement',
    '青溪保卫战旧-遗-址群': 'qingxi-defense-battle',
    '青溪保卫战旧遗址群': 'qingxi-defense-battle',
    '朱乙-朱豹烈士纪念碑': 'zhuyi-zhubao-martyrs-monument',
    '朱乙朱豹烈士纪念碑': 'zhuyi-zhubao-martyrs-monument',
    '红二-四师联合公审大会遗址': 'red-2nd-4th-division-trial',
    '红二四师联合公审大会遗址': 'red-2nd-4th-division-trial',
  };
  return nameMap[name] || cleanedMap[s] || s;
}

// ====== Process images ======
const srcDir = 'extracted_images';
const destDir = 'server/public/images/archives';

function processImages() {
  const results = {};
  let processed = 0;
  
  // Group images by site
  const siteImages = {};
  for (const img of imageMap) {
    if (!img.site) continue;
    if (!siteImages[img.site]) siteImages[img.site] = [];
    siteImages[img.site].push(img);
  }
  
  for (const img of imageMap) {
    const srcPath = path.join(srcDir, img.file);
    if (!fs.existsSync(srcPath)) {
      console.log('⚠ 文件不存在:', img.file);
      continue;
    }
    
    const baseName = img.site ? toFilename(img.site) : 'cover';
    const ext = path.extname(img.file);
    const siteGroup = img.site ? siteImages[img.site] : null;
    let suffix = '';
    if (siteGroup && siteGroup.length > 1) {
      const idx = siteGroup.findIndex(x => x.file === img.file);
      suffix = '_' + (idx + 1);
    }
    const destName = baseName + suffix + ext;
    const destPath = path.join(destDir, destName);
    
    // Get original size
    const origSize = fs.statSync(srcPath).size;
    
    // Copy file directly (compression can be done server-side)
    fs.copyFileSync(srcPath, destPath);
    console.log('  ' + img.file + ' -> ' + destName + ' (' + (origSize / 1024).toFixed(0) + ' KB)');
    
    // Record for SQL generation
    if (img.site) {
      if (!results[img.site]) results[img.site] = [];
      results[img.site].push({
        url: '/images/archives/' + destName,
        caption: img.caption || img.site
      });
    }
    
    processed++;
  }
  
  console.log('\n========== 处理结果 ==========');
  console.log('处理图片:', processed, '张');
  console.log('输出目录:', destDir);
  console.log('============================\n');
  
  return results;
}

// ====== Generate Updated SQL ======
function main() {
  console.log('开始处理图片...\n');
  const imageResults = processImages();
  
  // Filter valid sites (excluding the "25平方米..." garbage)
  const clean = sites.filter(s => !/^\d/.test(s.name) && s.name.length >= 4 && s.longitude);
  
  console.log('生成SQL...\n');
  
  const now = Date.now();
  let output = '-- 苏区革命旧遗址39处 - CMS内容批量导入（含图片）\n';
  output += '-- 生成时间: ' + new Date().toISOString() + '\n';
  output += '-- 共 ' + clean.length + ' 处遗址\n\n';
  output += 'SET NAMES utf8mb4;\n\n';
  
  for (const site of clean) {
    const name = site.name.replace(/'/g, "''");
    const desc = (site.description || site.location || '').substring(0, 300).replace(/'/g, "''");
    const id = 'doc-' + site.name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').substring(0, 20) + '-' + now;
    const contentId = 'content-archive-' + id;
    const versionId = 'version-archive-' + id + '-1';
    const year = site.year || 1927;
    
    let type = 'revolution';
    if (name.includes('纪念碑') || name.includes('烈士') || name.includes('纪念堂')) type = 'revolution';
    else if (name.includes('政府') || name.includes('乡农会') || name.includes('县委') || name.includes('区联队') || name.includes('队部')) type = 'government';
    else type = 'revolution';
    
    // Build media array from extracted images
    const siteImages = imageResults[site.name] || [];
    const firstImage = siteImages.length > 0 ? siteImages[0].url : '';
    const media = siteImages.map(img => ({
      type: 'image',
      url: img.url,
      caption: img.caption || ''
    }));
    
    const dataJson = {
      archiveType: type,
      type: type,
      year: year,
      longitude: site.longitude,
      latitude: site.latitude,
      address: site.location || site.village || '',
      coverImage: firstImage,
      historyPeriod: '',
      relatedPeople: [],
      relatedEvents: [],
      publishPositions: { map: true, list: true, home: false, topic: false, guide: false },
      detailBlocks: [],
      regionId: 'region-suqu',
      media: media
    };
    
    const dataJsonStr = JSON.stringify(dataJson).replace(/'/g, "''");
    
    output += '-- ' + name + '\n';
    output += "INSERT IGNORE INTO `contents` (`id`, `module_key`, `category`, `tags_json`, `status`, `title`, `summary`, `sensitive_level`, `risk_types_json`, `current_version_id`, `published_version_id`, `created_by`, `updated_by`, `created_at`, `updated_at`)\n";
    output += "VALUES ('" + contentId + "', 'archive', '" + type + "', '[]', 'published', '" + name + "', '" + desc.substring(0, 200) + "', 'normal', '[]', '" + versionId + "', '" + versionId + "', 'system', 'system', " + now + ", " + now + ");\n";
    
    output += "INSERT IGNORE INTO `content_versions` (`id`, `content_id`, `version_number`, `title`, `summary`, `body`, `data_json`, `created_by`, `created_at`)\n";
    output += "VALUES ('" + versionId + "', '" + contentId + "', 1, '" + name + "', '" + desc.substring(0, 200) + "', '" + desc + "', '" + dataJsonStr + "', 'system', " + now + ");\n";
    output += '\n';
  }
  
  output += '-- 完成导入（注意：仅导入 contents + content_versions，archives 表在 MySQL 中可能不存在）\n';
  
  fs.writeFileSync('import_sites_v3.sql', output, 'utf8');
  const size = fs.statSync('import_sites_v3.sql').size;
  console.log('\nSQL文件已生成: import_sites_v3.sql');
  console.log('大小:', (size / 1024).toFixed(1), 'KB');
  console.log('含图片引用的遗址:', Object.keys(imageResults).length, '处');
  console.log('总图片引用:', Object.values(imageResults).reduce((a,b) => a + b.length, 0), '张');
}

main();
