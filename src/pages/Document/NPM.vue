<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">NPM 知识库</h1>
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
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>📦 <span class="gradient-text">NPM 完全指南</span></h2>
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
          <p>📦 NPM 是世界上最大的软件注册表</p>
          <p>✨ 点击节点双向联动 | 包管理权威指南</p>
        </div>
      </aside>

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

      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 NPM 知识图谱 <span class="graph-badge">ECharts</span></h3>
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

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false);
const avatarWrapper = ref(null);
const userInfo = ref(null);
const currentTime = ref(new Date().toLocaleTimeString());
const isDark = ref(false);

const displayName = computed(() => {
  if (!userInfo.value) return '';
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'NPM用户';
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

const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person';
};

const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user_info');
  showDropdown.value = false;
  window.location.href = 'http://localhost:5173/';
};

// ========== NPM 导航数据 ==========
const navSections = ref([
  { title: '📚 基础入门', items: [
      { id: 'npm-intro', label: 'NPM 简介', hot: true },
      { id: 'npm-install', label: '安装与配置', hot: true },
      { id: 'package-json', label: 'package.json 详解', hot: true },
      { id: 'semver', label: '语义化版本', hot: true },
    ]},
  { title: '🔧 核心命令', items: [
      { id: 'npm-install-cmd', label: 'npm install', hot: true },
      { id: 'npm-update', label: 'npm update' },
      { id: 'npm-uninstall', label: 'npm uninstall' },
      { id: 'npm-run', label: 'npm run scripts', hot: true },
      { id: 'npm-publish', label: 'npm publish', hot: true },
    ]},
  { title: '📦 依赖管理', items: [
      { id: 'dependencies', label: 'dependencies vs devDependencies', hot: true },
      { id: 'peer-deps', label: 'peerDependencies' },
      { id: 'lock-files', label: 'package-lock.json', hot: true },
      { id: 'npm-link', label: 'npm link 本地开发' },
    ]},
  { title: '🛠️ 高级特性', items: [
      { id: 'npm-workspaces', label: 'Workspaces Monorepo', hot: true },
      { id: 'npm-audit', label: '安全审计', hot: true },
      { id: 'npm-cache', label: '缓存与加速' },
      { id: 'npx', label: 'npx 执行器', hot: true },
      { id: 'npm-config', label: '配置与镜像源' },
    ]},
  { title: '🌍 生态与替代', items: [
      { id: 'yarn', label: 'Yarn 对比', hot: true },
      { id: 'pnpm', label: 'pnpm 对比', hot: true },
      { id: 'npm-registry', label: '私有 Registry', hot: true },
      { id: 'npm-best-practices', label: '最佳实践' },
    ]},
]);

const selectedId = ref('npm-intro');

const allFlatItems = computed(() => {
  const flat = [];
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item));
  });
  return flat;
});

// ========== NPM 内容映射表 ==========
const contentMap = {
  'npm-intro': {
    title: 'NPM 简介',
    body: `
      <p class="lead">NPM（Node Package Manager）是世界上最大的软件注册表，拥有超过 200 万个包，每周下载量达数十亿次。</p>
      <h3>什么是 NPM？</h3>
      <ul>
        <li><strong>在线仓库</strong>：托管开源 JavaScript 包的平台</li>
        <li><strong>命令行工具</strong>：用于安装、管理、发布包的 CLI</li>
        <li><strong>包管理</strong>：自动处理依赖关系和版本冲突</li>
        <li><strong>生态核心</strong>：Node.js 生态的基石</li>
      </ul>
      <div class="note">💡 NPM 随 Node.js 一起安装，无需额外安装。检查版本：<code>npm --version</code></div>
    `,
    tags: ['包管理', 'Node.js', '注册表']
  },
  'npm-install': {
    title: '安装与配置',
    body: `
      <p class="lead">NPM 随 Node.js 自动安装，但可以单独更新和配置。</p>
      <pre><code># 使用 nvm 安装（推荐）
nvm install 20
nvm use 20

# 更新 NPM
npm install -g npm@latest

# 设置镜像源（国内加速）
npm config set registry https://registry.npmmirror.com

# 查看配置
npm config list</code></pre>
    `,
    tags: ['安装', '配置', '镜像源']
  },
  'package-json': {
    title: 'package.json 详解',
    body: `
      <p class="lead">package.json 是项目的核心配置文件，包含元数据、依赖、脚本等信息。</p>
      <pre><code>{
  "name": "my-project",
  "version": "1.0.0",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}</code></pre>
    `,
    tags: ['package.json', '配置', '元数据']
  },
  semver: {
    title: '语义化版本 (Semver)',
    body: `
      <p class="lead">语义化版本规范使用 <code>主版本.次版本.修订号</code> 格式。</p>
      <ul>
        <li><code>^1.2.3</code> - 兼容的主版本</li>
        <li><code>~1.2.3</code> - 兼容的次版本</li>
        <li><code>1.2.x</code> - 任意修订号</li>
      </ul>
    `,
    tags: ['semver', '版本管理']
  },
  'npm-install-cmd': {
    title: 'npm install',
    body: `
      <p class="lead">npm install 是最常用的命令，用于安装项目依赖。</p>
      <pre><code># 安装所有依赖
npm install

# 安装特定包
npm install lodash
npm i express

# 保存到 dependencies
npm install lodash --save

# 保存到 devDependencies
npm install jest --save-dev

# 全局安装
npm install -g nodemon</code></pre>
    `,
    tags: ['install', '依赖']
  },
  'npm-update': {
    title: 'npm update',
    body: `<p class="lead">更新项目依赖到符合版本范围的最新版本。</p>
    <pre><code># 更新所有依赖
npm update

# 检查哪些包可以更新
npm outdated</code></pre>`,
    tags: ['update', 'outdated']
  },
  'npm-uninstall': {
    title: 'npm uninstall',
    body: `<p class="lead">卸载不再需要的依赖包。</p>
    <pre><code># 卸载包
npm uninstall lodash

# 卸载全局包
npm uninstall -g nodemon</code></pre>`,
    tags: ['uninstall', '卸载']
  },
  'npm-run': {
    title: 'npm run scripts',
    body: `<p class="lead">package.json 中的 scripts 字段可以定义自定义脚本。</p>
    <pre><code>{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "build": "vite build"
  }
}

# 运行脚本
npm run start
npm run dev</code></pre>`,
    tags: ['scripts', '运行']
  },
  'npm-publish': {
    title: 'npm publish',
    body: `<p class="lead">将自己的包发布到 NPM 注册表。</p>
    <pre><code># 登录
npm login

# 发布
npm publish

# 更新版本
npm version patch   # 1.0.0 -> 1.0.1
npm version minor   # 1.0.0 -> 1.1.0</code></pre>`,
    tags: ['publish', '发布']
  },
  dependencies: {
    title: 'dependencies vs devDependencies',
    body: `<p class="lead">正确区分依赖类型有助于优化安装速度和包大小。</p>
    <ul>
      <li><strong>dependencies</strong>：生产环境必需的包</li>
      <li><strong>devDependencies</strong>：仅开发测试需要的包</li>
    </ul>`,
    tags: ['dependencies', 'devDependencies']
  },
  'peer-deps': {
    title: 'peerDependencies',
    body: `<p class="lead">peerDependencies 用于声明宿主环境需要提供的依赖。</p>
    <pre><code>{
  "peerDependencies": {
    "react": "^18.0.0"
  }
}</code></pre>`,
    tags: ['peerDependencies']
  },
  'lock-files': {
    title: 'package-lock.json',
    body: `<p class="lead">锁定依赖的精确版本，确保不同环境安装相同的依赖树。</p>
    <pre><code># 使用 npm ci 快速安装（CI 环境推荐）
npm ci</code></pre>`,
    tags: ['package-lock', 'npm ci']
  },
  'npm-link': {
    title: 'npm link 本地开发',
    body: `<p class="lead">在本地开发和测试包时，npm link 可以创建符号链接。</p>
    <pre><code># 在包目录下
npm link

# 在项目中使用
npm link my-package</code></pre>`,
    tags: ['npm link', '本地开发']
  },
  'npm-workspaces': {
    title: 'Workspaces Monorepo',
    body: `<p class="lead">NPM Workspaces 支持在单个仓库中管理多个包。</p>
    <pre><code>{
  "workspaces": ["packages/*", "apps/*"]
}</code></pre>`,
    tags: ['workspaces', 'Monorepo']
  },
  'npm-audit': {
    title: '安全审计',
    body: `<p class="lead">npm audit 扫描依赖中的已知安全漏洞。</p>
    <pre><code># 扫描漏洞
npm audit

# 自动修复
npm audit fix</code></pre>`,
    tags: ['audit', '安全']
  },
  'npm-cache': {
    title: '缓存与加速',
    body: `<p class="lead">NPM 缓存机制可以加速重复安装。</p>
    <pre><code># 清理缓存
npm cache clean --force

# 设置镜像源
npm config set registry https://registry.npmmirror.com</code></pre>`,
    tags: ['缓存', '镜像源']
  },
  npx: {
    title: 'npx 执行器',
    body: `<p class="lead">npx 无需安装即可运行 CLI 工具。</p>
    <pre><code># 创建 React 应用
npx create-react-app my-app

# 运行本地包
npx eslint --init</code></pre>`,
    tags: ['npx', '执行器']
  },
  'npm-config': {
    title: '配置与镜像源',
    body: `<p class="lead">NPM 配置可以设置镜像源、代理等。</p>
    <pre><code># 设置镜像源
npm config set registry https://registry.npmmirror.com

# 查看配置
npm config list</code></pre>`,
    tags: ['配置', '.npmrc']
  },
  yarn: {
    title: 'Yarn 对比',
    body: `<p class="lead">Yarn 是 Facebook 推出的替代包管理器。</p>
    <pre><code># Yarn 命令对比
yarn install      # npm install
yarn add lodash   # npm install lodash
yarn global add   # npm install -g</code></pre>`,
    tags: ['Yarn', '对比']
  },
  pnpm: {
    title: 'pnpm 对比',
    body: `<p class="lead">pnpm 是一个高效、节省磁盘空间的包管理器。</p>
    <pre><code># 安装 pnpm
npm install -g pnpm

# 基本命令
pnpm install
pnpm add lodash</code></pre>`,
    tags: ['pnpm', '对比']
  },
  'npm-registry': {
    title: '私有 Registry',
    body: `<p class="lead">企业内部可以使用私有 NPM Registry 托管私有包。</p>
    <pre><code># 使用 Verdaccio
npm install -g verdaccio
verdaccio

# .npmrc 配置
@mycompany:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=你的_GITHUB_TOKEN</code></pre>
    <div class="note">💡 将 \${GITHUB_TOKEN} 替换为实际的 GitHub Personal Access Token。</div>
    `,
    tags: ['私有Registry', 'Verdaccio']
  },
  'npm-best-practices': {
    title: '最佳实践',
    body: `<p class="lead">编写高质量 NPM 包和使用规范的建议。</p>
    <ul>
      <li>✅ 使用语义化版本规范</li>
      <li>✅ 提交 package-lock.json 到版本控制</li>
      <li>✅ 定期运行 npm audit 修复漏洞</li>
      <li>✅ 区分 dependencies 和 devDependencies</li>
    </ul>`,
    tags: ['最佳实践']
  }
};

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: `<p>📖 关于 <strong>${item.label}</strong> 的详细文档。参考 NPM 官方文档获取更多信息。</p>`,
        tags: ['NPM', '包管理']
      };
    }
  });
});

// ========== 图谱数据 ==========
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

addLink('npm-intro', 'npm-install');
addLink('npm-install', 'package-json');
addLink('package-json', 'semver');
addLink('npm-install-cmd', 'lock-files');
addLink('npm-publish', 'semver');
addLink('yarn', 'npm-intro');
addLink('pnpm', 'npm-intro');
addLink('npx', 'npm-install-cmd');

graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
);

const categories = ref(navSections.value.map(s => ({ name: s.title })));

// ========== ECharts 实例化 ==========
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

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

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
</style>