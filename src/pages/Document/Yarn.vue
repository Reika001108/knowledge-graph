<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Yarn 知识库</h1>
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
          <h2>🧶 <span class="gradient-text">Yarn 完全指南</span></h2>
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
          <p>🧶 快速、可靠、安全的依赖管理</p>
          <p>✨ 点击节点双向联动 | 现代化包管理</p>
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
          <h3>🔗 Yarn 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

// ---------- 用户及主题相关 ----------
const showDropdown = ref(false)
const avatarWrapper = ref(null)
const userInfo = ref(null)
const currentTime = ref(new Date().toLocaleTimeString())
const isDark = ref(false)

const displayName = computed(() => {
  if (!userInfo.value) return ''
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Yarn用户'
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
    nextTick(() => initChart())
  }
}

let timer = null
const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  if (avatarWrapper.value && !avatarWrapper.value.contains(event.target)) {
    showDropdown.value = false
  }
}

const goToProfile = () => {
  window.location.href = 'http://localhost:5173/person'
}

const logout = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user_info')
  showDropdown.value = false
  window.location.href = 'http://localhost:5173/'
}

// ========== Yarn 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'yarn-intro', label: 'Yarn 简介', hot: true },
      { id: 'yarn-install', label: '安装与配置', hot: true },
      { id: 'yarn-vs-npm', label: 'Yarn vs npm', hot: true }
    ]},
  { title: '🔧 核心命令', items: [
      { id: 'yarn-init', label: 'yarn init', hot: true },
      { id: 'yarn-add', label: 'yarn add', hot: true },
      { id: 'yarn-remove', label: 'yarn remove', hot: true },
      { id: 'yarn-install-cmd', label: 'yarn install', hot: true },
      { id: 'yarn-upgrade', label: 'yarn upgrade', hot: true },
      { id: 'yarn-run', label: 'yarn run', hot: true }
    ]},
  { title: '📦 依赖管理', items: [
      { id: 'yarn-lock', label: 'yarn.lock 文件', hot: true },
      { id: 'yarn-dedupe', label: '依赖去重', hot: true },
      { id: 'yarn-outdated', label: '检查更新', hot: true },
      { id: 'yarn-audit', label: '安全审计', hot: true }
    ]},
  { title: '🏗️ 高级特性', items: [
      { id: 'yarn-workspaces', label: 'Workspaces 工作空间', hot: true },
      { id: 'yarn-berry', label: 'Yarn Berry (v2+)', hot: true },
      { id: 'yarn-plugins', label: '插件系统', hot: true },
      { id: 'yarn-patch', label: '补丁管理', hot: true }
    ]},
  { title: '🔄 工作流', items: [
      { id: 'yarn-publish', label: '发布包', hot: true },
      { id: 'yarn-link', label: '链接本地包', hot: true },
      { id: 'yarn-cache', label: '缓存管理', hot: true },
      { id: 'yarn-ci', label: 'CI/CD 集成', hot: true }
    ]}
])

const selectedId = ref('yarn-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Yarn 内容映射表 ==========
const contentMap = {
  'yarn-intro': {
    title: 'Yarn 简介',
    body: '<p class="lead">Yarn 是一个快速、可靠、安全的 JavaScript 依赖管理工具，由 Facebook 于 2016 年发布，旨在解决 npm 的一些性能和安全问题。</p><h3>核心特点</h3><ul><li><strong>速度快</strong>：并行安装，缓存机制</li><li><strong>安全</strong>：使用校验和确保包完整性</li><li><strong>离线模式</strong>：一次安装，随处可用</li><li><strong>工作空间</strong>：原生支持 Monorepo</li><li><strong>确定性</strong>：yarn.lock 保证依赖一致性</li></ul><div class="note">💡 Yarn 2+ (Berry) 引入了 Plug\'n\'Play 和零安装等革命性特性。</div>',
    tags: ['包管理', 'JavaScript', 'Facebook']
  },
  'yarn-install': {
    title: '安装与配置',
    body: '<p class="lead">Yarn 可以通过多种方式安装。</p><pre><code># npm 安装\nnpm install -g yarn\n\n# macOS (Homebrew)\nbrew install yarn\n\n# Windows (Scoop)\nscoop install yarn\n\n# 验证安装\nyarn --version\n\n# 设置镜像源（国内加速）\nyarn config set registry https://registry.npmmirror.com\n\n# 查看配置\nyarn config list</code></pre>',
    tags: ['安装', '配置', '镜像源']
  },
  'yarn-vs-npm': {
    title: 'Yarn vs npm',
    body: '<p class="lead">Yarn 和 npm 的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>Yarn</th><th>npm</th></tr></thead><tbody><tr><td>安装速度</th><td>快（并行）</th><td>较慢</th></td><tr><td>离线缓存</th><td>支持</th><td>部分支持</th></tr><tr><td>锁文件</th><td>yarn.lock</th><td>package-lock.json</th></tr><tr><td>工作空间</th><td>原生支持</th><td>npm 7+ 支持</th></td><tr><td>Plug\'n\'Play</th><td>支持（Berry）</th><td>不支持</th></tr><td>命令简洁度</th><td>更简洁</th><td>标准</th></tr></tbody><table><pre><code># npm 命令\nnpm install\nnpm install lodash --save\nnpm install -D jest\n\n# Yarn 命令\nyarn\nyarn add lodash\nyarn add -D jest</code></pre>',
    tags: ['npm', '对比', '性能']
  },
  'yarn-init': {
    title: 'yarn init',
    body: '<p class="lead">初始化新项目，创建 package.json 文件。</p><pre><code># 交互式初始化\nyarn init\n\n# 快速初始化（使用默认值）\nyarn init -y\n\n# 指定入口文件\nyarn init -p\n\n# 交互式问题示例\n# question name (my-project):\n# question version (1.0.0):\n# question description: 项目描述\n# question entry point (index.js):\n# question repository url:\n# question author:\n# question license (MIT):</code></pre>',
    tags: ['init', '初始化', 'package.json']
  },
  'yarn-add': {
    title: 'yarn add',
    body: '<p class="lead">添加依赖包到项目。</p><pre><code># 添加生产依赖\nyarn add lodash\nyarn add express\n\n# 添加开发依赖\nyarn add -D jest\nyarn add --dev typescript\n\n# 添加指定版本\nyarn add lodash@4.17.21\n\n# 添加全局包\nyarn global add nodemon\n\n# 添加 git 仓库依赖\nyarn add user/repo\nyarn add https://github.com/user/repo.git\n\n# 添加 peer 依赖\nyarn add -P react</code></pre>',
    tags: ['add', '依赖安装', '--dev']
  },
  'yarn-remove': {
    title: 'yarn remove',
    body: '<p class="lead">移除不需要的依赖包。</p><pre><code># 移除依赖\nyarn remove lodash\n\n# 移除开发依赖\nyarn remove jest\n\n# 移除全局包\nyarn global remove nodemon\n\n# 移除并清理\nyarn remove lodash && yarn cache clean</code></pre>',
    tags: ['remove', '卸载', '清理']
  },
  'yarn-install-cmd': {
    title: 'yarn install',
    body: '<p class="lead">安装项目所有依赖。</p><pre><code># 安装所有依赖\nyarn install\n# 简写\nyarn\n\n# 忽略依赖版本\nyarn install --no-lockfile\n\n# 离线安装\nyarn install --offline\n\n# 只安装生产依赖\nyarn install --production\n\n# 强制重新下载\nyarn install --force\n\n# 检查 lockfile 一致性\nyarn install --frozen-lockfile</code></pre>',
    tags: ['install', '依赖安装', '离线']
  },
  'yarn-upgrade': {
    title: 'yarn upgrade',
    body: '<p class="lead">升级项目依赖。</p><pre><code># 升级所有依赖\nyarn upgrade\n\n# 升级指定包\nyarn upgrade lodash\n\n# 升级到最新版本（忽略版本范围）\nyarn upgrade lodash --latest\n\n# 交互式升级\nyarn upgrade-interactive\n\n# 升级全局包\nyarn global upgrade</code></pre>',
    tags: ['upgrade', '更新', '版本']
  },
  'yarn-run': {
    title: 'yarn run',
    body: '<p class="lead">运行 package.json 中定义的脚本。</p><pre><code># 运行脚本\nyarn run start\nyarn run build\nyarn run test\n\n# 简写\nyarn start\nyarn build\n\n# 传递参数\nyarn run test -- --coverage\n\n# 列出所有可用脚本\nyarn run</code></pre>',
    tags: ['run', '脚本', 'npm scripts']
  },
  'yarn-lock': {
    title: 'yarn.lock 文件',
    body: '<p class="lead">yarn.lock 锁定依赖的确切版本，确保安装一致性。</p><pre><code># yarn.lock 示例\nlodash@^4.17.21:\n  version "4.17.21"\n  resolved "https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz"\n  integrity sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==\n\n# 更新 lockfile\nyarn install\n\n# 重新生成 lockfile\nrm yarn.lock\nyarn install</code></pre>',
    tags: ['lockfile', '锁定版本', '一致性']
  },
  'yarn-dedupe': {
    title: '依赖去重',
    body: '<p class="lead">优化依赖树，去除重复版本。</p><pre><code># 依赖去重\nyarn dedupe\n\n# 查看重复依赖\nyarn list --pattern lodash\n\n# 强制去重\nyarn dedupe --check\n\n# 只去重指定包\nyarn dedupe lodash</code></pre>',
    tags: ['dedupe', '去重', '优化']
  },
  'yarn-outdated': {
    title: '检查更新',
    body: '<p class="lead">查看哪些依赖有新版本。</p><pre><code># 检查可更新的包\nyarn outdated\n\n# 输出示例\nPackage  Current  Wanted  Latest  Workspace\nlodash   4.17.20  4.17.21 4.17.21  my-project\nexpress 4.17.1   4.18.2  4.18.2   my-project\n\n# 只检查生产依赖\nyarn outdated --prod\n\n# JSON 格式输出\nyarn outdated --json</code></pre>',
    tags: ['outdated', '检查更新', '版本']
  },
  'yarn-audit': {
    title: '安全审计',
    body: '<p class="lead">扫描依赖中的安全漏洞。</p><pre><code># 扫描漏洞\nyarn audit\n\n# 自动修复\nyarn audit --fix\n\n# 查看详细信息\nyarn audit --json\n\n# 只检查生产依赖\nyarn audit --groups dependencies\n\n# 忽略指定漏洞\nyarn audit --level moderate</code></pre>',
    tags: ['audit', '安全', '漏洞']
  },
  'yarn-workspaces': {
    title: 'Workspaces 工作空间',
    body: '<p class="lead">原生支持 Monorepo，管理多个包。</p><pre><code>// package.json（根目录）\n{\n  "private": true,\n  "workspaces": [\n    "packages/*",\n    "apps/*"\n  ]\n}\n\n// 添加 workspace 依赖\nyarn workspace web-app add lodash\n\n// 运行 workspace 脚本\nyarn workspace web-app run dev\n\n// 在所有 workspace 中运行\nyarn workspaces run test\n\n// 添加 workspace 之间的依赖\nyarn workspace web-app add shared@*\n\n// 查看 workspace 信息\nyarn workspaces info</code></pre>',
    tags: ['workspaces', 'Monorepo', '多包管理']
  },
  'yarn-berry': {
    title: 'Yarn Berry (v2+)',
    body: '<p class="lead">Yarn 2+ 版本，引入 Plug\'n\'Play 等革命性特性。</p><pre><code># 升级到 Yarn Berry\nyarn set version berry\n\n# 主要特性\n# 1. Plug\'n\'Play (PnP) - 不再需要 node_modules\n# 2. 零安装 - 缓存所有包\n# 3. 更严格的依赖\n# 4. 更好的 TypeScript 支持\n\n# .yarnrc.yml 配置\nnodeLinker: pnp\npnpMode: strict\n\n# 启用零安装\nyarn install --immutable-cache</code></pre>',
    tags: ['Yarn Berry', 'PnP', '零安装']
  },
  'yarn-plugins': {
    title: '插件系统',
    body: '<p class="lead">Yarn Berry 支持插件扩展功能。</p><pre><code># 安装插件\nyarn plugin import @yarnpkg/plugin-workspace-tools\nyarn plugin import @yarnpkg/plugin-version\n\n# 查看已安装插件\nyarn plugin list\n\n# 常用插件\n# - @yarnpkg/plugin-workspace-tools\n# - @yarnpkg/plugin-version\n# - @yarnpkg/plugin-typescript\n# - @yarnpkg/plugin-interactive-tools\n\n# 自定义插件\n# .yarnrc.yml\nplugins:\n  - path: ./my-plugin.js</code></pre>',
    tags: ['插件', '扩展', 'Yarn Berry']
  },
  'yarn-patch': {
    title: '补丁管理',
    body: '<p class="lead">修改第三方包的源码。</p><pre><code># 创建补丁\nyarn patch lodash@4.17.21\n\n# 编辑后提交\nyarn patch-commit /tmp/lodash-patch\n\n# package.json 中配置\n{\n  "resolutions": {\n    "lodash@4.17.21": "patch:lodash@npm:4.17.21#.yarn/patches/lodash.patch"\n  }\n}\n\n# 应用补丁\nyarn install</code></pre>',
    tags: ['patch', '补丁', '修改源码']
  },
  'yarn-publish': {
    title: '发布包',
    body: '<p class="lead">将包发布到 npm 注册表。</p><pre><code># 登录\nyarn login\n\n# 发布\nyarn publish\n\n# 发布 beta 版本\nyarn publish --tag beta\n\n# 发布 workspace 包\nyarn workspaces foreach -pt run publish\n\n# 使用 version 命令\n# 更新版本号\nyarn version patch   # 1.0.0 -> 1.0.1\nyarn version minor   # 1.0.0 -> 1.1.0\nyarn version major   # 1.0.0 -> 2.0.0\n\n# 发布前检查\nyarn pack --dry-run</code></pre>',
    tags: ['publish', '发布', '版本']
  },
  'yarn-link': {
    title: '链接本地包',
    body: '<p class="lead">在本地开发和测试包时使用链接。</p><pre><code># 在包目录下创建链接\nyarn link\n\n# 在项目中使用链接\nyarn link my-package\n\n# 解除链接\nyarn unlink my-package\n\n# 使用相对路径（Yarn Berry）\nyarn add ../my-package\n\n# 查看链接的包\nyarn list --depth=0</code></pre>',
    tags: ['link', '本地开发', '符号链接']
  },
  'yarn-cache': {
    title: '缓存管理',
    body: '<p class="lead">管理 Yarn 的缓存。</p><pre><code># 查看缓存目录\nyarn cache dir\n\n# 查看缓存内容\nyarn cache list\n\n# 清理缓存\nyarn cache clean\n\n# 清理指定包的缓存\nyarn cache clean lodash\n\n# 查看缓存大小\ndu -sh $(yarn cache dir)</code></pre>',
    tags: ['cache', '缓存', '清理']
  },
  'yarn-ci': {
    title: 'CI/CD 集成',
    body: '<p class="lead">在 CI 环境中使用 Yarn。</p><pre><code># GitHub Actions 示例\n- uses: actions/setup-node@v3\n  with:\n    node-version: \'18\'\n    cache: \'yarn\'\n- run: yarn install --frozen-lockfile\n\n# GitLab CI 示例\nbefore_script:\n  - yarn install --frozen-lockfile\ncache:\n  paths:\n    - .yarn/cache\n\n# CircleCI 示例\n- restore_cache:\n    keys:\n      - yarn-packages-{{ checksum "yarn.lock" }}\n- run: yarn install --frozen-lockfile\n- save_cache:\n    paths:\n      - .yarn/cache\n    key: yarn-packages-{{ checksum "yarn.lock" }}\n\n# 常用 CI 选项\n# --frozen-lockfile: lockfile 必须匹配\n# --immutable: 禁止修改 lockfile\n# --immutable-cache: 使用缓存</code></pre>',
    tags: ['CI/CD', 'GitHub Actions', '缓存']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Yarn 官方文档获取更多信息。</p>',
        tags: ['Yarn', '包管理']
      }
    }
  })
})

// ========== 图谱数据 ==========
const graphNodes = ref(
  navSections.value.flatMap((section, idx) =>
    section.items.map(item => ({
      id: item.id,
      name: item.label,
      category: idx
    }))
  )
)

const graphLinks = ref([])

const addLink = (source, target) => {
  if (source && target && graphNodes.value.some(n => n.id === source) && graphNodes.value.some(n => n.id === target)) {
    graphLinks.value.push({ source, target })
  }
}

addLink('yarn-intro', 'yarn-install')
addLink('yarn-install', 'yarn-vs-npm')
addLink('yarn-init', 'yarn-add')
addLink('yarn-add', 'yarn-remove')
addLink('yarn-remove', 'yarn-install-cmd')
addLink('yarn-install-cmd', 'yarn-upgrade')
addLink('yarn-upgrade', 'yarn-run')
addLink('yarn-lock', 'yarn-dedupe')
addLink('yarn-dedupe', 'yarn-outdated')
addLink('yarn-outdated', 'yarn-audit')
addLink('yarn-workspaces', 'yarn-berry')
addLink('yarn-berry', 'yarn-plugins')
addLink('yarn-plugins', 'yarn-patch')
addLink('yarn-publish', 'yarn-link')
addLink('yarn-link', 'yarn-cache')
addLink('yarn-cache', 'yarn-ci')

graphLinks.value = graphLinks.value.filter((link, index, self) =>
  index === self.findIndex(l => l.source === link.source && l.target === link.target)
)

const categories = ref(navSections.value.map(s => ({ name: s.title })))

// ========== ECharts 实例化 ==========
const chartRef = ref(null)
let chartInstance = ref(null)

const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance.value) chartInstance.value.dispose()
  chartInstance.value = echarts.init(chartRef.value, isDark.value ? 'dark' : null)
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
  }
  chartInstance.value.setOption(option)
  chartInstance.value.on('click', { seriesIndex: 0 }, (params) => {
    if (params.dataType === 'node') {
      const nodeId = params.data.id
      if (nodeId && contentMap[nodeId]) {
        selectedId.value = nodeId
        const targetEl = document.getElementById('content-' + nodeId)
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' })
      }
    }
  })
}

const zoomIn = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomIn' }) }
const zoomOut = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphZoomOut' }) }
const fitToView = () => { if (chartInstance.value) chartInstance.value.dispatchAction({ type: 'graphRoam', roam: 'reset' }) }

const contentAreaRef = ref(null)
let scrollHandler = null

const updateActiveOnScroll = () => {
  if (!contentAreaRef.value) return
  const blocks = contentAreaRef.value.querySelectorAll('.content-block')
  let bestBlock = null, maxVisible = 0
  const areaRect = contentAreaRef.value.getBoundingClientRect()
  blocks.forEach(block => {
    const rect = block.getBoundingClientRect()
    const visibleTop = Math.max(rect.top, areaRect.top)
    const visibleBottom = Math.min(rect.bottom, areaRect.bottom)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)
    if (visibleHeight > maxVisible) {
      maxVisible = visibleHeight
      bestBlock = block
    }
  })
  if (bestBlock) {
    const id = bestBlock.id.replace('content-', '')
    if (id !== selectedId.value) selectedId.value = id
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 模拟用户登录
  const token = localStorage.getItem('authToken');
  if (!token) {
    userInfo.value = { username: '测试用户', email: 'test@example.com' };
  } else {
    try {
      userInfo.value = JSON.parse(localStorage.getItem('user_info'));
    } catch (e) {}
  }

  document.addEventListener('click', handleClickOutside);
  timer = setInterval(updateTime, 1000);
  nextTick(() => {
    initChart();
    // 初始化滚动监听
    if (contentAreaRef.value) {
      scrollHandler = updateActiveOnScroll;
      contentAreaRef.value.addEventListener('scroll', scrollHandler);
      // 初始触发一次
      updateActiveOnScroll();
    }
    // 如果URL有hash，滚动到对应位置（例如从外部链接进入）
    if (window.location.hash) {
      const id = window.location.hash.substring(1); // 去掉 '#'
      const target = document.getElementById(id);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      // 默认滚动到 doctype
      const defaultTarget = document.getElementById('content-doctype');
      if (defaultTarget) {
        defaultTarget.scrollIntoView();
      }
    }
  });

  window.addEventListener('resize', () => chartInstance.value?.resize());
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', handleClickOutside)
  if (contentAreaRef.value && scrollHandler) contentAreaRef.value.removeEventListener('scroll', scrollHandler)
  if (chartInstance.value) chartInstance.value.dispose()
})
</script>

<style scoped>
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
  padding: 0 20px;
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
  font-family: monospace;
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
  font-family: monospace;
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