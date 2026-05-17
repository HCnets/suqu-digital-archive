const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'archives.json');
const TRIBUTES_FILE = path.join(__dirname, 'tributes.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

app.use(cors());
app.use(bodyParser.json());

function readJsonFile(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ========================
//  Archives API
// ========================

app.get('/api/archives', (req, res) => {
  try {
    const data = readJsonFile(DATA_FILE, {});
    res.json(Object.values(data));
  } catch (error) {
    res.status(500).json({ error: '读取数据失败' });
  }
});

app.post('/api/archives', (req, res) => {
  try {
    const newArchive = req.body;
    if (!newArchive.id) {
      newArchive.id = `poi-${Date.now()}`;
    }
    const data = readJsonFile(DATA_FILE, {});
    data[newArchive.id] = newArchive;
    writeJsonFile(DATA_FILE, data);
    res.status(201).json(newArchive);
  } catch (error) {
    res.status(500).json({ error: '保存数据失败' });
  }
});

// ========================
//  Tributes API (线上致敬)
// ========================

if (!fs.existsSync(TRIBUTES_FILE)) {
  writeJsonFile(TRIBUTES_FILE, { count: 11990821 });
}

app.get('/api/tributes', (req, res) => {
  try {
    const data = readJsonFile(TRIBUTES_FILE, { count: 0 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '读取致敬数据失败' });
  }
});

app.post('/api/tributes', (req, res) => {
  try {
    const data = readJsonFile(TRIBUTES_FILE, { count: 0 });
    data.count += 1;
    writeJsonFile(TRIBUTES_FILE, data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '致敬操作失败' });
  }
});

// ========================
//  Messages API (群众留言)
// ========================

if (!fs.existsSync(MESSAGES_FILE)) {
  writeJsonFile(MESSAGES_FILE, [
    { id: 'msg-1', name: '群众 138****9921', identity: '群众', text: '重走红军路，才知道今天的幸福生活多么来之不易。向先烈致敬！', createdAt: Date.now() - 60000 },
    { id: 'msg-2', name: '紫金县实验中学 少先队', identity: '少先队员', text: '我们是共产主义接班人！请党放心，强国有我！', createdAt: Date.now() - 600000 },
    { id: 'msg-3', name: '老党员 张建国', identity: '党员', text: '看到血田遗址的介绍，老泪纵横。江山就是人民，人民就是江山。', createdAt: Date.now() - 1800000 },
    { id: 'msg-4', name: '群众 159****3342', identity: '群众', text: '数字大屏做得太震撼了，像是在参观国家级博物馆。为苏区点赞！', createdAt: Date.now() - 3600000 },
    { id: 'msg-5', name: '河源市青年学习小组', identity: '团员', text: '走好新时代的长征路，把群众路线坚持到底。', createdAt: Date.now() - 7200000 },
    { id: 'msg-6', name: '大埔围村 党员小队', identity: '党员', text: '看了红屋的介绍，更加坚定了为人民服务的初心使命。', createdAt: Date.now() - 10800000 },
  ]);
}

app.get('/api/messages', (req, res) => {
  try {
    const data = readJsonFile(MESSAGES_FILE, []);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '读取留言失败' });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { name, identity, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: '留言内容不能为空' });
    }
    const messages = readJsonFile(MESSAGES_FILE, []);
    const newMsg = {
      id: `msg-${Date.now()}`,
      name: name || '匿名群众',
      identity: identity || '群众',
      text: text.trim(),
      createdAt: Date.now()
    };
    messages.unshift(newMsg);
    if (messages.length > 100) messages.length = 100;
    writeJsonFile(MESSAGES_FILE, messages);
    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ error: '留言提交失败' });
  }
});

app.listen(PORT, () => {
  console.log(`[SYS] 苏区数字档案后端服务运行中 http://localhost:${PORT}`);
  console.log(`      - GET  /api/archives  获取所有档案`);
  console.log(`      - POST /api/archives  新增档案`);
  console.log(`      - GET  /api/tributes  获取致敬计数`);
  console.log(`      - POST /api/tributes  参与致敬`);
  console.log(`      - GET  /api/messages  获取留言列表`);
  console.log(`      - POST /api/messages  提交留言`);
});
