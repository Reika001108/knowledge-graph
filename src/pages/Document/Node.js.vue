<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Node.js 知识库</h1>
      </div>
      <div class="user-section">
        <div class="current-time">{{ currentTime }}</div>
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'">
          <i :class="isDark ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <div class="avatar-wrapper" ref="avatarWrapper">
          <div class="avatar" @click.stop="toggleDropdown">
            <i class="fas fa-user-circle"></i>
            <span class="username" v-if="userInfo">{{ displayName }}</span>
          </div>
          <div v-if="showDropdown" class="dropdown-menu">
            <a href="#" class="dropdown-item" @click.prevent="goToProfile">个人中心</a>
            <a href="#" class="dropdown-item" @click.prevent="logout">退出</a>
          </div>
        </div>
      </div>
    </header>

    <main class="main-content">
      <!-- 左侧导航（锚点链接 - Node.js 分类） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🚀 <span class="gradient-text">Node.js 权威指南</span></h2>
          <div class="header-decoration"></div>
        </div>

        <div class="nav-sections">
          <div v-for="section in navSections" :key="section.title" class="nav-section">
            <h3 class="section-title">
              {{ section.title }}
              <span class="section-count">{{ section.items.length }}</span>
            </h3>
            <a
              v-for="item in section.items"
              :key="item.id"
              :href="'#content-' + item.id"
              class="nav-item"
              :class="{ active: selectedId === item.id }"
              @click="selectedId = item.id"
            >
              <span class="item-dot"></span>
              {{ item.label }}
              <span v-if="item.hot" class="hot-badge">核心</span>
            </a>
          </div>
        </div>

        <div class="sidebar-footer">
          <p>🚀 基于 Node.js 20.x LTS 官方文档</p>
          <p>✨ 点击节点双向联动 | 服务端开发指南</p>
        </div>
      </aside>

      <!-- 中间内容区（连续长文档） -->
      <section class="content-area" ref="contentAreaRef">
        <div class="continuous-content">
          <div
            v-for="item in allFlatItems"
            :key="item.id"
            :id="'content-' + item.id"
            class="content-block"
          >
            <div class="content-card" v-if="contentMap[item.id]">
              <div class="content-header">
                <h1 class="content-title">{{ contentMap[item.id].title }}</h1>
              </div>
              <div class="content-body" v-html="contentMap[item.id].body"></div>
              <div class="content-footer">
                <span class="tag-label">🏷️ 相关概念</span>
                <div class="tag-list">
                  <span class="tag" v-for="tag in contentMap[item.id].tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div v-else class="content-card placeholder">
              <h2>📖 {{ item.label }} 的详细文档正在同步中...</h2>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧图谱（Node.js 知识关系图） -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Node.js 知识图谱 <span class="graph-badge">ECharts</span></h3>
          <p class="graph-hint">点击节点跳转 · 拖拽缩放</p>
        </div>
        <div ref="chartRef" class="chart-container"></div>
        <div class="graph-footer">
          <span>⚡ 共 {{ graphNodes.length }} 节点 | {{ graphLinks.length }} 关联</span>
          <div class="graph-controls">
            <button class="control-btn" @click="zoomOut" title="缩小">
              <i class="fas fa-search-minus"></i>
            </button>
            <button class="control-btn" @click="fitToView" title="适应页面">
              <i class="fas fa-arrows-alt"></i>
            </button>
            <button class="control-btn" @click="zoomIn" title="放大">
              <i class="fas fa-search-plus"></i>
            </button>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import * as echarts from 'echarts';

// ---------- 用户及主题相关（保持不变）----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const userInfo = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);

const displayName = computed(() => {
  if (!userInfo.value) return '';
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Node.js开发者';
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (chartInstance.value) {
    chartInstance.value.dispose();
    chartInstance.value = null;
    nextTick(() => initChart());
  }
};

let timer = null;
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString();
};

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

// 点击个人中心跳转到 /person 页面
const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person';
};

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  showDropdown.value = false;
  window.location.href = 'http://localhost:5173/';
};

// ========== Node.js 导航数据 ==========
const navSections = ref([
  { title: '⚙️ 核心基础', items: [
      { id: 'node-intro', label: 'Node.js 简介', hot: true },
      { id: 'node-setup', label: '安装与版本管理', hot: true },
      { id: 'global-objects', label: '全局对象', hot: true },
      { id: 'modules', label: '模块系统 (CommonJS)', hot: true },
      { id: 'event-loop', label: '事件循环', hot: true },
    ]},
  { title: '📁 核心模块', items: [
      { id: 'fs-module', label: 'fs 文件系统', hot: true },
      { id: 'path-module', label: 'path 路径处理', hot: true },
      { id: 'http-module', label: 'http / https', hot: true },
      { id: 'os-module', label: 'os 操作系统' },
      { id: 'events-module', label: 'events 事件触发器', hot: true },
      { id: 'stream-module', label: 'Stream 流', hot: true },
      { id: 'buffer-module', label: 'Buffer 缓冲区', hot: true },
    ]},
  { title: '🔐 异步与流程', items: [
      { id: 'callbacks', label: '回调函数' },
      { id: 'promises', label: 'Promise 与 async/await', hot: true },
      { id: 'child-process', label: '子进程' },
      { id: 'cluster', label: '集群模块' },
    ]},
  { title: '🌐 Web 开发', items: [
      { id: 'express', label: 'Express 框架', hot: true },
      { id: 'middleware', label: '中间件概念' },
      { id: 'routing', label: '路由处理' },
      { id: 'rest-api', label: 'RESTful API 设计' },
    ]},
  { title: '🛠️ 工程化', items: [
      { id: 'npm', label: 'npm / yarn / pnpm', hot: true },
      { id: 'env-vars', label: '环境变量', hot: true },
      { id: 'debugging', label: '调试与性能' },
      { id: 'security', label: '安全最佳实践' },
      { id: 'testing-node', label: '单元测试' },
    ]},
]);

const selectedId = ref('node-intro');

// 扁平化所有知识点
const allFlatItems = computed(() => {
  const flat = [];
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item));
  });
  return flat;
});

// ========== Node.js 内容映射表 ==========
const contentMap = {
  'node-intro': {
    title: 'Node.js 简介',
    body: `
      <p class="lead">Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境，让 JavaScript 可以脱离浏览器运行在服务器端。</p>
      <h3>核心特性</h3>
      <ul>
        <li><strong>事件驱动</strong>：基于事件循环的非阻塞 I/O 模型</li>
        <li><strong>单线程</strong>：主线程单线程，但底层通过 libuv 实现异步</li>
        <li><strong>高并发</strong>：轻量高效，适合 I/O 密集型应用</li>
        <li><strong>NPM 生态</strong>：全球最大的开源包管理器</li>
        <li><strong>跨平台</strong>：Windows、macOS、Linux 全支持</li>
      </ul>
      <div class="note">💡 Node.js 由 Ryan Dahl 于 2009 年创建，目前由 OpenJS 基金会维护，广泛应用于 API 服务、实时应用、CLI 工具等场景。</div>
      <pre><code>// 第一个 Node.js 程序
console.log('Hello Node.js!');

// 创建 HTTP 服务器
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Hello World');
});
server.listen(3000);</code></pre>
    `,
    tags: ['JavaScript', '服务端', '事件驱动']
  },
  'node-setup': {
    title: '安装与版本管理',
    body: `
      <p class="lead">Node.js 官方提供 LTS（长期支持）和 Current（最新）两个版本线。</p>
      <h3>安装方式</h3>
      <ul>
        <li><strong>官网下载</strong>：https://nodejs.org/ 下载安装包</li>
        <li><strong>包管理器</strong>：Homebrew (macOS)、Chocolatey (Windows)、apt (Ubuntu)</li>
        <li><strong>版本管理工具</strong>：nvm (推荐)、n、fnm</li>
      </ul>
      <h3>使用 nvm 管理多版本</h3>
      <pre><code># 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js
nvm install 20.10.0
nvm install 18.18.0

# 切换版本
nvm use 20.10.0

# 设置默认版本
nvm alias default 20.10.0

# 查看版本
node --version
npm --version</code></pre>
      <div class="note">🎯 建议始终使用 LTS 版本用于生产环境，Current 版本用于尝鲜。</div>
    `,
    tags: ['安装', 'nvm', 'LTS']
  },
  'global-objects': {
    title: '全局对象',
    body: `
      <p class="lead">Node.js 中的全局对象可以在任何地方直接访问，无需 require。</p>
      <h3>常用全局对象</h3>
      <pre><code>// global - 全局命名空间（类似浏览器的 window）
global.myVar = 'hello';

// __dirname - 当前模块的目录绝对路径
console.log(__dirname);

// __filename - 当前模块的文件绝对路径
console.log(__filename);

// process - 进程相关
console.log(process.version);    // Node.js 版本
console.log(process.argv);       // 命令行参数
console.log(process.env.NODE_ENV); // 环境变量
process.exit(0);                 // 退出进程

// console - 日志输出
console.log, console.error, console.warn, console.table

// setTimeout / setInterval / setImmediate
setTimeout(() => {}, 1000);
setImmediate(() => {});  // 在当前事件循环结束时执行</code></pre>
    `,
    tags: ['global', 'process', '__dirname']
  },
  modules: {
    title: '模块系统 (CommonJS)',
    body: `
      <p class="lead">Node.js 采用 CommonJS 模块规范，每个文件都是一个独立的模块。</p>
      <h3>导出模块</h3>
      <pre><code>// math.js
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;

// 方式一：导出单个
module.exports = add;

// 方式二：导出多个
module.exports = { add, multiply };

// 方式三：exports 快捷方式
exports.add = add;
exports.multiply = multiply;</code></pre>
      <h3>导入模块</h3>
      <pre><code>// 导入内置模块
const fs = require('fs');
const path = require('path');

// 导入第三方模块
const express = require('express');

// 导入自定义模块
const { add, multiply } = require('./math');
const add = require('./math');</code></pre>
      <h3>ES Module 支持 (Node.js 12+)</h3>
      <pre><code>// package.json 中设置 "type": "module"
import fs from 'fs';
import { add } from './math.js';

// 或使用 .mjs 扩展名</code></pre>
    `,
    tags: ['CommonJS', 'require', 'module.exports']
  },
  'event-loop': {
    title: '事件循环 (Event Loop)',
    body: `
      <p class="lead">事件循环是 Node.js 实现非阻塞 I/O 的核心机制，使单线程可以处理大量并发请求。</p>
      <h3>事件循环阶段顺序</h3>
      <pre><code>   ┌───────────────────────────┐
┌─>│           timers          │  setTimeout, setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │     pending callbacks     │  系统级回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │       idle, prepare       │  内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           poll            │  I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
│  │           check           │  setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────┴─────────────┐
└──┤      close callbacks      │  socket.on('close')
   └───────────────────────────┘</code></pre>
      <h3>执行顺序示例</h3>
      <pre><code>setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// 输出顺序: nextTick -> promise -> timeout/immediate (顺序不定)</code></pre>
      <div class="note">📌 <code>process.nextTick()</code> 和 <code>Promise</code> 微任务会在当前阶段结束后立即执行，优先级高于定时器。</div>
    `,
    tags: ['事件循环', 'libuv', '异步']
  },
  'fs-module': {
    title: 'fs 文件系统模块',
    body: `
      <p class="lead">fs 模块提供文件读写、目录操作等 API，支持同步、回调和 Promise 三种方式。</p>
      <h3>异步回调方式</h3>
      <pre><code>const fs = require('fs');

// 读取文件
fs.readFile('./file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 写入文件
fs.writeFile('./output.txt', 'Hello World', (err) => {
  if (err) throw err;
});

// 创建目录
fs.mkdir('./new-dir', { recursive: true }, (err) => {});</code></pre>
      <h3>同步方式</h3>
      <pre><code>const data = fs.readFileSync('./file.txt', 'utf8');
fs.writeFileSync('./output.txt', 'Hello');</code></pre>
      <h3>Promise 方式 (fs/promises)</h3>
      <pre><code>const fs = require('fs/promises');

async function read() {
  try {
    const data = await fs.readFile('./file.txt', 'utf8');
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}</code></pre>
      <h3>常用方法</h3>
      <ul>
        <li><code>fs.readFile / writeFile</code> - 读写文件</li>
        <li><code>fs.createReadStream / createWriteStream</code> - 流式读写大文件</li>
        <li><code>fs.stat</code> - 获取文件信息</li>
        <li><code>fs.unlink</code> - 删除文件</li>
        <li><code>fs.readdir</code> - 读取目录</li>
        <li><code>fs.watch</code> - 监听文件变化</li>
      </ul>
    `,
    tags: ['fs', '文件读写', '流']
  },
  'path-module': {
    title: 'path 路径模块',
    body: `
      <p class="lead">path 模块提供跨平台的文件路径处理工具，自动处理 Windows 和 POSIX 路径差异。</p>
      <pre><code>const path = require('path');

// 路径拼接（推荐）
const fullPath = path.join('/users', 'john', 'docs', 'file.txt');
// => '/users/john/docs/file.txt'

// 解析绝对路径
const resolved = path.resolve('docs', 'file.txt');
// => /current/working/dir/docs/file.txt

// 获取文件名
path.basename('/foo/bar/baz.txt');    // 'baz.txt'
path.basename('/foo/bar/baz.txt', '.txt'); // 'baz'

// 获取目录名
path.dirname('/foo/bar/baz.txt');     // '/foo/bar'

// 获取扩展名
path.extname('index.html');           // '.html'

// 路径解析
const parsed = path.parse('/home/user/file.txt');
// { root: '/', dir: '/home/user', base: 'file.txt', ext: '.txt', name: 'file' }

// 格式化路径
const formatted = path.format(parsed); // '/home/user/file.txt'

// 规范化路径
path.normalize('/foo//bar/../baz');    // '/foo/baz'

// 获取相对路径
path.relative('/data/orandea/test/aaa', '/data/orandea/impl/bbb');
// => '../../impl/bbb'</code></pre>
      <div class="note">💡 始终使用 <code>path.join()</code> 而不是手动拼接字符串，避免跨平台问题。</div>
    `,
    tags: ['path', '路径', '跨平台']
  },
  'http-module': {
    title: 'http / https 模块',
    body: `
      <p class="lead">Node.js 内置 HTTP 服务器和客户端模块，可以快速搭建 Web 服务。</p>
      <h3>创建 HTTP 服务器</h3>
      <pre><code>const http = require('http');

const server = http.createServer((req, res) => {
  const { method, url, headers } = req;
  console.log(\`\${method} \${url}\`);
  
  // 设置响应头
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  
  // 发送响应体
  res.end('&lt;h1&gt;Hello Node.js&lt;/h1&gt;');
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});</code></pre>
      <h3>处理不同路由</h3>
      <pre><code>const server = http.createServer((req, res) => {
  const url = req.url;
  
  if (url === '/') {
    res.end('Home Page');
  } else if (url === '/about') {
    res.end('About Page');
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
});</code></pre>
      <h3>发起 HTTP 请求</h3>
      <pre><code>const https = require('https');

https.get('https://api.github.com/users/octocat', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});</code></pre>
    `,
    tags: ['HTTP', '服务器', '请求']
  },
  'os-module': {
    title: 'os 操作系统模块',
    body: `
      <p class="lead">os 模块提供与操作系统相关的系统信息。</p>
      <pre><code>const os = require('os');

// CPU 信息
console.log(os.cpus());
console.log(os.arch());        // 'x64'
console.log(os.endianness());  // 'LE'

// 内存信息
console.log(os.totalmem());    // 总内存 (bytes)
console.log(os.freemem());     // 空闲内存
console.log(os.uptime());      // 系统运行时间 (秒)

// 网络接口
console.log(os.networkInterfaces());

// 用户信息
console.log(os.userInfo());
console.log(os.homedir());
console.log(os.hostname());

// 平台信息
console.log(os.platform());    // 'linux', 'darwin', 'win32'
console.log(os.type());        // 'Linux', 'Darwin', 'Windows_NT'
console.log(os.release());</code></pre>
    `,
    tags: ['os', '系统信息', '跨平台']
  },
  'events-module': {
    title: 'events 事件触发器',
    body: `
      <p class="lead">Node.js 核心模块，许多内置对象继承自 EventEmitter，实现发布/订阅模式。</p>
      <h3>基本用法</h3>
      <pre><code>const EventEmitter = require('events');
const emitter = new EventEmitter();

// 注册事件监听
emitter.on('greet', (name) => {
  console.log(\`Hello, \${name}!\`);
});

// 注册一次性监听
emitter.once('onceEvent', () => {
  console.log('This will run only once');
});

// 触发事件
emitter.emit('greet', 'Alice');
emitter.emit('onceEvent');
emitter.emit('onceEvent'); // 不会输出

// 移除监听器
const callback = () => {};
emitter.on('event', callback);
emitter.off('event', callback);
emitter.removeListener('event', callback);
emitter.removeAllListeners();</code></pre>
      <h3>继承 EventEmitter</h3>
      <pre><code>class MyEmitter extends EventEmitter {
  doSomething() {
    this.emit('done', 'Task completed');
  }
}

const myEmitter = new MyEmitter();
myEmitter.on('done', (msg) => console.log(msg));
myEmitter.doSomething();</code></pre>
      <h3>错误处理</h3>
      <pre><code>emitter.on('error', (err) => {
  console.error('Caught:', err);
});
emitter.emit('error', new Error('Something went wrong'));</code></pre>
    `,
    tags: ['EventEmitter', '事件', '发布订阅']
  },
  'stream-module': {
    title: 'Stream 流',
    body: `
      <p class="lead">Stream 是 Node.js 处理大量数据的抽象接口，实现高效的数据处理。</p>
      <h3>流类型</h3>
      <ul>
        <li><strong>Readable</strong> - 可读流（fs.createReadStream）</li>
        <li><strong>Writable</strong> - 可写流（fs.createWriteStream）</li>
        <li><strong>Duplex</strong> - 双工流（net.Socket）</li>
        <li><strong>Transform</strong> - 变换流（zlib, crypto）</li>
      </ul>
      <h3>使用可读流</h3>
      <pre><code>const fs = require('fs');
const readStream = fs.createReadStream('./large-file.txt', { encoding: 'utf8' });

readStream.on('data', (chunk) => {
  console.log(\`Received \${chunk.length} bytes\`);
});

readStream.on('end', () => {
  console.log('File read complete');
});

readStream.on('error', (err) => {
  console.error(err);
});</code></pre>
      <h3>管道操作</h3>
      <pre><code>// 复制文件
const readStream = fs.createReadStream('./source.txt');
const writeStream = fs.createWriteStream('./dest.txt');
readStream.pipe(writeStream);

// 链式管道（压缩）
const zlib = require('zlib');
fs.createReadStream('./file.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./file.txt.gz'));</code></pre>
    `,
    tags: ['Stream', '管道', '大文件']
  },
  'buffer-module': {
    title: 'Buffer 缓冲区',
    body: `
      <p class="lead">Buffer 用于处理二进制数据，在 TCP 流、文件操作等场景中必不可少。</p>
      <pre><code>// 创建 Buffer
const buf1 = Buffer.from('Hello Node.js', 'utf8');
const buf2 = Buffer.alloc(10);     // 分配 10 字节（零填充）
const buf3 = Buffer.allocUnsafe(10); // 可能包含旧数据（更快）

// 写入和读取
buf2.write('Hi', 0, 'utf8');
console.log(buf2.toString());      // 'Hi'

// Buffer 转字符串
console.log(buf1.toString());      // 'Hello Node.js'
console.log(buf1.toString('hex')); // 十六进制

// Buffer 操作
const combined = Buffer.concat([buf1, buf2]);
console.log(combined.length);

// 比较
const bufA = Buffer.from('abc');
const bufB = Buffer.from('abd');
console.log(bufA.compare(bufB));   // -1 (a < b)</code></pre>
    `,
    tags: ['Buffer', '二进制', '编码']
  },
  callbacks: {
    title: '回调函数',
    body: `
      <p class="lead">回调是 Node.js 最基础的异步模式，遵循错误优先（error-first）约定。</p>
      <pre><code>// 错误优先回调
const fs = require('fs');
fs.readFile('./file.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error:', err.message);
    return;
  }
  console.log('Content:', data);
});

// 回调地狱问题
doSomething((err, result1) => {
  if (err) handleError(err);
  doSomethingElse(result1, (err, result2) => {
    if (err) handleError(err);
    doAnotherThing(result2, (err, result3) => {
      // 回调地狱
    });
  });
});

// 解决方案：使用 Promise、async/await 或控制流库</code></pre>
    `,
    tags: ['回调', 'error-first', '异步']
  },
  promises: {
    title: 'Promise 与 async/await',
    body: `
      <p class="lead">Promise 是回调的现代化替代方案，async/await 让异步代码更接近同步写法。</p>
      <h3>Promise 基础</h3>
      <pre><code>const readFilePromise = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

readFilePromise('./file.txt')
  .then(data => console.log(data))
  .catch(err => console.error(err));</code></pre>
      <h3>async/await 语法</h3>
      <pre><code>const fs = require('fs/promises');

async function readFiles() {
  try {
    const data1 = await fs.readFile('./file1.txt', 'utf8');
    const data2 = await fs.readFile('./file2.txt', 'utf8');
    console.log(data1, data2);
    
    // 并发执行
    const [d1, d2] = await Promise.all([
      fs.readFile('./file1.txt', 'utf8'),
      fs.readFile('./file2.txt', 'utf8')
    ]);
  } catch (err) {
    console.error(err);
  }
}

readFiles();</code></pre>
    `,
    tags: ['Promise', 'async/await', '异步']
  },
  'child-process': {
    title: '子进程',
    body: `
      <p class="lead">child_process 模块允许创建子进程，执行系统命令或其他脚本。</p>
      <pre><code>const { exec, spawn, execFile, fork } = require('child_process');

// exec - 缓冲输出
exec('ls -la', (err, stdout, stderr) => {
  if (err) console.error(err);
  console.log(stdout);
});

// spawn - 流式输出（适合大量数据）
const ls = spawn('ls', ['-la']);
ls.stdout.on('data', (data) => console.log(data.toString()));
ls.on('close', (code) => console.log(\`Exit code: \${code}\`));

// execFile - 执行可执行文件
execFile('node', ['--version'], (err, stdout) => {
  console.log(stdout);
});

// fork - 专门用于 Node.js 子进程（支持 IPC 通信）
const child = fork('./child-script.js');
child.on('message', (msg) => console.log('From child:', msg));
child.send({ hello: 'parent' });</code></pre>
    `,
    tags: ['子进程', 'exec', 'spawn']
  },
  cluster: {
    title: '集群模块',
    body: `
      <p class="lead">cluster 模块利用多核 CPU 提高 Node.js 应用的并发处理能力。</p>
      <pre><code>const cluster = require('cluster');
const http = require('http');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(\`Master \${process.pid} is running\`);
  
  // 创建多个工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(\`Worker \${worker.process.pid} died\`);
    cluster.fork(); // 重启工作进程
  });
} else {
  // 工作进程共享同一个 TCP 连接
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello from worker ' + process.pid);
  }).listen(8000);
  
  console.log(\`Worker \${process.pid} started\`);
}</code></pre>
    `,
    tags: ['cluster', '多进程', '负载均衡']
  },
  express: {
    title: 'Express 框架',
    body: `
      <p class="lead">Express 是最流行的 Node.js Web 框架，极简、灵活、生态丰富。</p>
      <h3>基本用法</h3>
      <pre><code>const express = require('express');
const app = express();
const port = 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'John' });
});

app.post('/api/users', (req, res) => {
  console.log(req.body);
  res.status(201).json({ message: 'User created' });
});

// 静态文件
app.use(express.static('public'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});</code></pre>
    `,
    tags: ['Express', 'Web框架', '路由']
  },
  middleware: {
    title: '中间件概念',
    body: `
      <p class="lead">中间件是 Express 的核心，按顺序执行的函数，可以访问 req、res 和下一个中间件。</p>
      <pre><code>// 应用级中间件
app.use((req, res, next) => {
  console.log(\`\${req.method} \${req.url}\`);
  next();
});

// 路由级中间件
const authMiddleware = (req, res, next) => {
  if (req.headers.authorization) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Secret data' });
});

// 内置中间件
app.use(express.json());
app.use(express.static('public'));

// 第三方中间件
const cors = require('cors');
const morgan = require('morgan');
app.use(cors());
app.use(morgan('combined'));

// 错误处理中间件（4个参数）
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});</code></pre>
    `,
    tags: ['中间件', 'Express', '请求处理']
  },
  routing: {
    title: '路由处理',
    body: `
      <p class="lead">路由定义应用端点（URI）如何响应客户端请求。</p>
      <pre><code>const express = require('express');
const router = express.Router();

// 路由参数
router.get('/users/:userId/books/:bookId', (req, res) => {
  res.json({
    userId: req.params.userId,
    bookId: req.params.bookId
  });
});

// 查询参数
router.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  res.json({ query: q, page, limit });
});

// 路由分组
router.route('/posts')
  .get((req, res) => { /* 获取所有文章 */ })
  .post((req, res) => { /* 创建文章 */ });

router.route('/posts/:id')
  .get((req, res) => { /* 获取单篇文章 */ })
  .put((req, res) => { /* 更新文章 */ })
  .delete((req, res) => { /* 删除文章 */ });

// 模块化路由
const userRouter = require('./routes/users');
app.use('/api/users', userRouter);</code></pre>
    `,
    tags: ['路由', '参数', 'RESTful']
  },
  'rest-api': {
    title: 'RESTful API 设计',
    body: `
      <p class="lead">REST 是一种 API 设计规范，使用 HTTP 方法表示操作，资源用 URL 标识。</p>
      <h3>HTTP 方法语义</h3>
      <ul>
        <li><strong>GET</strong> - 获取资源（幂等、安全）</li>
        <li><strong>POST</strong> - 创建资源</li>
        <li><strong>PUT</strong> - 完整更新资源（幂等）</li>
        <li><strong>PATCH</strong> - 部分更新资源</li>
        <li><strong>DELETE</strong> - 删除资源（幂等）</li>
      </ul>
      <h3>状态码规范</h3>
      <pre><code>// 成功
200 OK          // GET/PUT 成功
201 Created     // POST 创建成功
204 No Content  // DELETE 成功

// 客户端错误
400 Bad Request   // 参数错误
401 Unauthorized  // 未认证
403 Forbidden     // 无权限
404 Not Found     // 资源不存在

// 服务端错误
500 Internal Server Error</code></pre>
      <pre><code>// Express 实现示例
app.get('/api/resources', async (req, res) => {
  const resources = await Resource.find();
  res.json(resources);
});

app.post('/api/resources', async (req, res) => {
  const resource = await Resource.create(req.body);
  res.status(201).json(resource);
});</code></pre>
    `,
    tags: ['REST', 'API', 'HTTP']
  },
  npm: {
    title: 'npm / yarn / pnpm',
    body: `
      <p class="lead">Node.js 的包管理器，拥有全球最大的开源软件生态。</p>
      <h3>常用 npm 命令</h3>
      <pre><code># 初始化项目
npm init -y

# 安装依赖
npm install express
npm install -D jest      # 开发依赖
npm install -g nodemon   # 全局安装

# 卸载依赖
npm uninstall express

# 更新依赖
npm update
npm outdated

# 运行脚本
npm run start
npm test

# 查看信息
npm list
npm info lodash</code></pre>
      <h3>package.json 关键字段</h3>
      <pre><code>{
  "name": "my-app",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}</code></pre>
      <div class="note">💡 pnpm 节省磁盘空间，yarn 提供 workspace 特性，根据团队偏好选择。</div>
    `,
    tags: ['npm', '包管理', '依赖']
  },
  'env-vars': {
    title: '环境变量',
    body: `
      <p class="lead">环境变量用于配置应用在不同环境下的行为，如端口、数据库连接等。</p>
      <h3>使用环境变量</h3>
      <pre><code>// 读取环境变量
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL;
const nodeEnv = process.env.NODE_ENV; // 'development', 'production'

// 设置环境变量（命令行）
// NODE_ENV=production PORT=8080 node app.js

// 使用 dotenv 管理
// .env 文件
PORT=3000
DATABASE_URL=mongodb://localhost:27017/mydb

// app.js
require('dotenv').config();
console.log(process.env.PORT);</code></pre>
      <h3>.env 最佳实践</h3>
      <pre><code># .env.example（提交到版本控制）
PORT=
DATABASE_URL=
JWT_SECRET=

# .env（本地开发，不提交）
PORT=3000
DATABASE_URL=mongodb://localhost:27017/dev
JWT_SECRET=my-secret-key</code></pre>
    `,
    tags: ['环境变量', 'dotenv', '配置']
  },
  debugging: {
    title: '调试与性能',
    body: `
      <p class="lead">Node.js 内置调试器以及 Chrome DevTools 集成。</p>
      <h3>内置调试器</h3>
      <pre><code># 启动调试
node inspect app.js
node --inspect app.js
node --inspect-brk app.js  # 在第一行暂停

# Chrome DevTools
# 打开 chrome://inspect 连接到 Node.js 进程</code></pre>
      <h3>性能分析</h3>
      <pre><code>// CPU 分析
node --cpu-prof app.js

// 内存分析
node --heap-prof app.js

// 使用 clinic 工具
npx clinic doctor -- node app.js</code></pre>
      <h3>常用调试工具</h3>
      <ul>
        <li>console.log / console.time</li>
        <li>debug 模块</li>
        <li>VS Code 调试器</li>
        <li>nodemon --inspect</li>
      </ul>
    `,
    tags: ['调试', '性能', 'DevTools']
  },
  security: {
    title: '安全最佳实践',
    body: `
      <p class="lead">Node.js 应用安全防护的常见措施。</p>
      <h3>OWASP 建议</h3>
      <ul>
        <li><strong>输入验证</strong> - 使用 Joi、express-validator</li>
        <li><strong>SQL 注入防护</strong> - 使用参数化查询或 ORM</li>
        <li><strong>XSS 防护</strong> - 输出转义，使用 helmet</li>
        <li><strong>CSRF 防护</strong> - csurf 中间件</li>
        <li><strong>速率限制</strong> - express-rate-limit</li>
      </ul>
      <pre><code>const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet()); // 设置安全 HTTP 头

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制 100 次请求
});
app.use('/api', limiter);

// 不要暴露敏感信息
process.env.NODE_ENV === 'production' && app.use(express.static('public'));</code></pre>
    `,
    tags: ['安全', '防护', 'OWASP']
  },
  'testing-node': {
    title: '单元测试',
    body: `
      <p class="lead">Node.js 生态中的测试框架：Jest、Mocha、Vitest。</p>
      <h3>Jest 示例</h3>
      <pre><code>// math.js
function add(a, b) { return a + b; }
module.exports = { add };

// math.test.js
const { add } = require('./math');

test('adds 1 + 2 to equal 3', () => {
  expect(add(1, 2)).toBe(3);
});

describe('add function', () => {
  it('should handle negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });
});

// 异步测试
test('async test', async () => {
  const data = await fetchData();
  expect(data).toBe('expected');
});</code></pre>
      <h3>package.json 配置</h3>
      <pre><code>{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}</code></pre>
    `,
    tags: ['测试', 'Jest', '单元测试']
  }
};

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: `<p>📖 关于 <strong>${item.label}</strong> 的详细文档。参考 Node.js 官方文档获取更多信息。</p><pre><code>// ${item.label} 示例代码\n// Node.js 相关实现</code></pre>`,
        tags: ['Node.js', 'JavaScript']
      };
    }
  });
});

// ========== 图谱数据（Node.js 知识点关系网）==========
const graphNodes = ref(
  navSections.value.flatMap((section, idx) =>
    section.items.map(item => ({
      id: item.id,
      name: item.label,
      category: idx,
    }))
  )
);

const graphLinks = ref([]);
const addLink = (source, target) => {
  if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
    graphLinks.value.push({ source, target });
  }
};

// 构建 Node.js 知识关系
addLink('node-intro', 'node-setup');
addLink('node-setup', 'global-objects');
addLink('global-objects', 'modules');
addLink('modules', 'event-loop');
addLink('event-loop', 'callbacks');
addLink('callbacks', 'promises');
addLink('fs-module', 'stream-module');
addLink('fs-module', 'buffer-module');
addLink('http-module', 'express');
addLink('express', 'middleware');
addLink('express', 'routing');
addLink('routing', 'rest-api');
addLink('npm', 'env-vars');
addLink('debugging', 'testing-node');
addLink('security', 'env-vars');
addLink('cluster', 'child-process');
addLink('events-module', 'event-loop');

// 去重
graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
);

const categories = ref(navSections.value.map(s => ({ name: s.title })));

// ========== ECharts 实例化与交互 ==========
const chartRef = ref(null);
let chartInstance = ref(null);

const initChart = () => {
  if (!chartRef.value) return;
  if (chartInstance.value) chartInstance.value.dispose();
  chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null);
  const option = {
    title: { show: false },
    tooltip: { show: true, formatter: (params) => params.name },
    series: [{
      type: 'graph',
      layout: 'force',
      roam: true,
      draggable: true,
      data: graphNodes.value.map(node => ({
        id: node.id,
        name: node.name,
        category: node.category,
        symbolSize: 28,
        itemStyle: { color: isDark.value ? '#8B5CF6' : '#007acc' }
      })),
      links: graphLinks.value,
      categories: categories.value,
      lineStyle: { color: 'source', curveness: 0.3, width: 1.8 },
      force: { repulsion: 400, edgeLength: 130, gravity: 0.1 },
      label: { show: true, position: 'bottom', fontSize: 10, color: isDark.value ? '#e0e0e0' : '#333' },
      emphasis: { focus: 'adjacency' }
    }]
  };
  chartInstance.value.setOption(option);
  chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id;
      if (nodeId && contentMap[nodeId]) {
        selectedId.value = nodeId;
        const targetEl = document.getElementById('content-' + nodeId);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
};

const zoomIn = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomIn' }); };
const zoomOut = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomOut' }); };
const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphRoam', roam: 'reset' }); };

const contentAreaRef = ref(null);
let scrollHandler = null;
const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return;
  const blocks = contentAreaRef.value.querySelectorAll('.content-block');
  let bestBlock = null, maxVisible = 0;
  const areaRect = contentAreaRef.value.getBoundingClientRect();
  blocks.forEach(block => {
    const rect = block.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, areaRect.top);
    const visibleBottom = Math.min(rect.bottom, areaRect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight;
      bestBlock = block;
    }
  });
  if (bestBlock) {
    const id = bestBlock.id.replace('content-', '');
    if (id !== selectedId.value) selectedId.value = id;
  }
};

onMounted(() => {
    const token = localStorage.getItem('authToken');
    if (!token) userInfo.value = { username: 'CSS设计师', email: 'css@example.com' };
    else try { userInfo.value = JSON.parse(localStorage.getItem('user_info')); } catch(e) {}
    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
    nextTick(() => {
        initChart();
        if (contentAreaRef.value) {
            scrollHandler = updateActiveOnScroll;
            contentAreaRef.value.addEventListener('scroll', scrollHandler);
            updateActiveOnScroll();
        }
        const defaultTarget = document.getElementById('content-selectors_intro');
        if (defaultTarget) defaultTarget.scrollIntoView();
    });
    window.addEventListener('resize', () => chartInstance.value?.resize());
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
  document.removeEventListener('click', handleClickOutside);
  if (contentAreaRef.value && scrollHandler) contentAreaRef.value.removeEventListener('scroll', scrollHandler);
  if (chartInstance.value) chartInstance.value.dispose();
});
</script>

<style scoped>
/* ===== 全局设计令牌（原紫色配色） ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #FAF5FF;
  transition: background-color 0.3s, color 0.3s;
}

.app-container.dark {
  background-color: #1e1e2f;
  color: #e0e0e0;
}

/* 顶栏样式 - 原紫色 */
.header {
  width: 100%;
  height: 10vh;
  background-color: #8B5CF6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1);
  z-index: 1000;
  transition: background-color 0.3s;
}

.app-container.dark .header {
  background-color: #2c2c3a;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 50px;
  margin-right: 15px;
  border-radius: 8px;
}

.app-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.current-time {
  color: white;
  font-size: 16px;
  background-color: rgba(255,255,255,0.2);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.theme-toggle {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  background-color: rgba(255,255,255,0.2);
}

.avatar-wrapper {
  position: relative;
}

.avatar {
  font-size: 40px;
  color: white;
  transition: color 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar .username {
  font-size: 14px;
  background: rgba(255,255,255,0.2);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.avatar:hover {
  color: #f0f0f0;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 50px;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  overflow: hidden;
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.app-container.dark .dropdown-menu {
  background-color: #2c2c3a;
  color: #e0e0e0;
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: #333;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
  color: #8B5CF6;
}

.app-container.dark .dropdown-item {
  color: #e0e0e0;
}
.app-container.dark .dropdown-item:hover {
  background-color: #3a3a4a;
  color: #8B5CF6;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 主内容区域（三栏布局） */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航 */
.sidebar {
  width: 300px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 40, 80, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 4px 0 20px rgba(0,20,40,0.05);
  transition: background-color 0.3s;
}

.app-container.dark .sidebar {
  background: rgba(44,44,58,0.7);
  border-right-color: rgba(255,255,255,0.1);
}

.sidebar-header {
  padding: 24px 20px 16px;
  position: relative;
}

.sidebar-header h2 {
  margin: 0 0 4px;
  font-size: 1.8rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.gradient-text {
  background: linear-gradient(135deg, #1a3650, #2b6c9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-container.dark .gradient-text {
  background: linear-gradient(135deg, #a0c4e5, #8B5CF6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-decoration {
  height: 4px;
  width: 60px;
  background: linear-gradient(90deg, #007acc, #a0c4e5);
  border-radius: 4px;
  margin-top: 12px;
}

.nav-sections {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 16px;
  scrollbar-width: thin;
}

.nav-section {
  margin-bottom: 16px;
}

.section-title {
  padding: 0 20px;
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #2c5779;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-container.dark .section-title {
  color: #b0b0c0;
}

.section-count {
  background: rgba(0,122,204,0.1);
  color: #007acc;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
}

.app-container.dark .section-count {
  background: rgba(139,92,246,0.2);
  color: #8B5CF6;
}

.nav-item {
  display: block;
  padding: 8px 20px 8px 36px;
  font-size: 0.94rem;
  cursor: pointer;
  color: #1e2a3a;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  text-decoration: none;
  position: relative;
}

.app-container.dark .nav-item {
  color: #e0e0e0;
}

.nav-item:hover {
  background: rgba(0,122,204,0.06);
  border-left-color: #80b5dc;
}

.app-container.dark .nav-item:hover {
  background: rgba(139,92,246,0.15);
  border-left-color: #8B5CF6;
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(0,122,204,0.12) 0%, rgba(255,255,255,0) 90%);
  border-left-color: #007acc;
  font-weight: 550;
  color: #00548b;
}

.app-container.dark .nav-item.active {
  background: linear-gradient(90deg, rgba(139,92,246,0.2) 0%, transparent 90%);
  border-left-color: #8B5CF6;
  color: #c0a0ff;
}

.item-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #8faec9;
  border-radius: 50%;
  margin-right: 8px;
  transition: all 0.2s;
}

.app-container.dark .item-dot {
  background: #a0a0c0;
}

.nav-item.active .item-dot {
  background: #007acc;
  transform: scale(1.4);
  box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
}

.app-container.dark .nav-item.active .item-dot {
  background: #8B5CF6;
  box-shadow: 0 0 0 2px rgba(139,92,246,0.4);
}

.hot-badge {
  background: #ff984f;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 30px;
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  float: right;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(0,40,80,0.1);
  font-size: 0.75rem;
  color: #556c80;
  display: flex;
  justify-content: space-between;
  background: rgba(255,255,255,0.4);
}

.app-container.dark .sidebar-footer {
  border-top-color: rgba(255,255,255,0.1);
  color: #aaa;
  background: rgba(58,58,74,0.4);
}

/* 中间内容区 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 36px;
  background: #ffffff;
  scroll-behavior: smooth;
}

.continuous-content {
  max-width: 1000px;
  margin: 0 auto;
}

.content-block {
  margin-bottom: 40px;
  scroll-margin-top: 20px;
  padding: 0 20px;
}

.content-block:not(:last-child) {
  border-bottom: 1px solid rgba(0, 40, 80, 0.1);
  padding-bottom: 40px;
}

.app-container.dark .content-block:not(:last-child) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.app-container.dark .content-area {
  background: #1e1e2f;
}

.content-card {
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  border: none;
  padding: 0;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(0, 122, 204, 0.2);
  padding-bottom: 12px;
}

.content-title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 600;
  background: linear-gradient(145deg, #162b3a, #1f4970);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.app-container.dark .content-title {
  background: linear-gradient(145deg, #e0e0e0, #b0b0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.content-body {
  line-height: 1.7;
  font-size: 1.02rem;
  color: #1e2f3c;
}

.app-container.dark .content-body {
  color: #d0d0e0;
}

.content-body h3 {
  margin: 32px 0 16px;
  font-size: 1.5rem;
  font-weight: 550;
  color: #1e3a5f;
}

.app-container.dark .content-body h3 {
  color: #b0b0ff;
}

.content-body code {
  background: #e7edf4;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  color: #c4125e;
  border: 1px solid #d5dee7;
}

.app-container.dark .content-body code {
  background: #3a3a4a;
  color: #ffa0a0;
  border-color: #5a5a6a;
}

.content-body pre {
  background: #1e2a3a;
  color: #e3eaf0;
  border-radius: 18px;
  padding: 20px;
  overflow-x: auto;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 28px 0;
  box-shadow: inset 0 0 0 1px #33475b, 0 8px 16px -8px #00000030;
}

.content-body pre code {
  background: transparent;
  padding: 0;
  color: #c9dff2;
  border: none;
}

.lead {
  font-size: 1.25rem;
  font-weight: 380;
  color: #2a4359;
  border-left: 5px solid #007acc;
  padding-left: 24px;
  margin: 0 0 28px;
  background: linear-gradient(90deg, #e3f0fc, transparent);
}

.app-container.dark .lead {
  color: #c0d0e0;
  border-left-color: #8B5CF6;
  background: linear-gradient(90deg, rgba(139,92,246,0.2), transparent);
}

.note {
  background: #eef6ff;
  border-left: 5px solid #007acc;
  padding: 18px 24px;
  margin: 30px 0;
  border-radius: 0 24px 24px 0;
  box-shadow: 0 4px 10px -6px #a0b8d0;
}

.app-container.dark .note {
  background: #3a3a4a;
  border-left-color: #8B5CF6;
}

.content-footer {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px dashed #cbd6e3;
}

.app-container.dark .content-footer {
  border-top-color: #5a5a6a;
}

.tag-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #2b4f6e;
  margin-right: 12px;
}

.app-container.dark .tag-label {
  color: #b0b0ff;
}

.tag-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  background: #eef3f9;
  padding: 4px 14px;
  border-radius: 30px;
  font-size: 0.8rem;
  color: #1c4970;
  border: 1px solid #d0e0f0;
}

.app-container.dark .tag {
  background: #3a3a4a;
  color: #d0d0e0;
  border-color: #5a5a6a;
}

.content-card.placeholder {
  text-align: center;
  color: #7f8fa4;
  padding: 60px;
}

/* 右侧图谱 */
.graph-panel {
  width: 340px;
  background: rgba(255,255,255,0.5);
  backdrop-filter: blur(8px);
  border-left: 1px solid rgba(0,40,80,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 20px rgba(0,20,40,0.03);
  transition: background-color 0.3s;
}

.app-container.dark .graph-panel {
  background: rgba(44,44,58,0.5);
  border-left-color: rgba(255,255,255,0.1);
}

.graph-header {
  padding: 24px 18px 12px;
  border-bottom: 1px solid rgba(0,40,80,0.1);
}

.app-container.dark .graph-header {
  border-bottom-color: rgba(255,255,255,0.1);
}

.graph-header h3 {
  margin: 0 0 4px;
  font-size: 1.2rem;
  font-weight: 650;
  color: #1a3b55;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-container.dark .graph-header h3 {
  color: #e0e0e0;
}

.graph-badge {
  background: #1f4a74;
  color: white;
  font-size: 0.6rem;
  padding: 2px 8px;
  border-radius: 40px;
  font-weight: 500;
}

.app-container.dark .graph-badge {
  background: #8B5CF6;
}

.graph-hint {
  margin: 0;
  font-size: 0.75rem;
  color: #4b6a88;
}

.app-container.dark .graph-hint {
  color: #aaa;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 240px;
  background: #fafdff;
  border-radius: 0;
}

.app-container.dark .chart-container {
  background: #2c2c3a;
}

.graph-footer {
  padding: 14px 16px;
  border-top: 1px solid rgba(0,40,80,0.1);
  font-size: 0.75rem;
  color: #3b5a78;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.5);
}

.app-container.dark .graph-footer {
  border-top-color: rgba(255,255,255,0.1);
  color: #aaa;
  background: rgba(58,58,74,0.5);
}

.graph-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #8B5CF6;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(139, 92, 246, 0.3);
}

.control-btn:hover {
  background: #A78BFA;
  transform: scale(1.05);
}

.control-btn:active {
  transform: scale(0.95);
}
</style>

<style>
@import '../fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
.mdn-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  border: 1px solid rgba(0,40,80,0.1);
}
.mdn-table th {
  background: rgba(139, 92, 246, 0.1);
  font-weight: 600;
  text-align: left;
  padding: 10px 12px;
}
.mdn-table td {
  padding: 10px 12px;
  border-top: 1px solid rgba(0,40,80,0.05);
}
.deprecated {
  color: #d32f2f;
  background: rgba(211, 47, 47, 0.05);
  border-radius: 4px;
  padding: 2px 6px;
}
</style>