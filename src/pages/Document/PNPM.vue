<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">PNPM 知识库</h1>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>⚡ <span class="gradient-text">PNPM 完全指南</span></h2>
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
          <p>⚡ 快速、节省磁盘空间的包管理器</p>
          <p>✨ 点击节点双向联动 | 高效 Monorepo 支持</p>
        </div>
      </aside>

      <!-- 中间内容区 -->
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

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 PNPM 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'PNPM用户'
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

// ========== PNPM 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'pnpm-intro', label: 'PNPM 简介', hot: true },
      { id: 'pnpm-install', label: '安装与配置', hot: true },
      { id: 'pnpm-basics', label: '基本命令', hot: true },
      { id: 'pnpm-vs-npm', label: 'PNPM vs NPM', hot: true }
    ]},
  { title: '📦 依赖管理', items: [
      { id: 'pnpm-add', label: '添加依赖', hot: true },
      { id: 'pnpm-remove', label: '移除依赖' },
      { id: 'pnpm-update', label: '更新依赖' },
      { id: 'pnpm-link', label: '链接本地包' },
      { id: 'pnpm-patch', label: '补丁管理', hot: true }
    ]},
  { title: '🏗️ Monorepo 支持', items: [
      { id: 'pnpm-workspace', label: 'Workspace 配置', hot: true },
      { id: 'pnpm-filter', label: '过滤命令', hot: true },
      { id: 'pnpm-catalog', label: '目录版本管理' },
      { id: 'pnpm-publish', label: '发布工作流' }
    ]},
  { title: '⚙️ 高级特性', items: [
      { id: 'pnpm-store', label: '全局存储', hot: true },
      { id: 'pnpm-lockfile', label: 'pnpm-lock.yaml', hot: true },
      { id: 'pnpm-overrides', label: '依赖覆盖' },
      { id: 'pnpm-audit', label: '安全审计' }
    ]},
  { title: '🔧 配置与 CI/CD', items: [
      { id: 'pnpm-config', label: '配置选项' },
      { id: 'pnpm-ci', label: 'CI/CD 集成', hot: true },
      { id: 'pnpm-mirror', label: '镜像与缓存' }
    ]}
])

const selectedId = ref('pnpm-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== PNPM 内容映射表 ==========
const contentMap = {
  'pnpm-intro': {
    title: 'PNPM 简介',
    body: '<p class="lead">PNPM（Performant NPM）是一个快速、节省磁盘空间的包管理器。它使用硬链接和符号链接来管理 node_modules，避免重复安装相同版本的包。</p><h3>核心优势</h3><ul><li><strong>节省磁盘空间</strong>：所有包只存储一份，通过硬链接共享</li><li><strong>极快速度</strong>：比 NPM/Yarn 快 2-3 倍</li><li><strong>严格依赖</strong>：避免幽灵依赖问题</li><li><strong>Monorepo 支持</strong>：内置 workspace 支持</li></ul><div class="note">💡 PNPM 已被 Vue、Vite、Nuxt、Element Plus 等主流项目采用。</div>',
    tags: ['包管理', '高性能', 'Monorepo']
  },
  'pnpm-install': {
    title: '安装与配置',
    body: '<p class="lead">PNPM 可以通过多种方式安装，支持所有主流操作系统。</p><pre><code># 使用 npm 安装\nnpm install -g pnpm\n\n# 使用 Homebrew (macOS)\nbrew install pnpm\n\n# 验证安装\npnpm --version\n\n# 设置镜像源（国内加速）\npnpm config set registry https://registry.npmmirror.com</code></pre>',
    tags: ['安装', '配置', '镜像源']
  },
  'pnpm-basics': {
    title: '基本命令',
    body: '<p class="lead">PNPM 的命令与 NPM 高度相似，上手非常简单。</p><pre><code># 初始化项目\npnpm init\n\n# 安装所有依赖\npnpm install\n\n# 添加依赖\npnpm add lodash\npnpm add -D jest\n\n# 运行脚本\npnpm run start\npnpm dev\n\n# 全局安装\npnpm add -g nodemon</code></pre>',
    tags: ['基本命令', 'install', 'add']
  },
  'pnpm-vs-npm': {
    title: 'PNPM vs NPM',
    body: '<p class="lead">PNPM 与 NPM 的核心区别在于 node_modules 结构和磁盘利用率。</p><table class="mdn-table"><thead><tr><th>特性</th><th>PNPM</th><th>NPM</th></tr></thead><tbody><tr><td>node_modules 结构</td><td>非扁平化（符号链接）</td><td>扁平化</td></tr><tr><td>磁盘空间</td><td>节省 60-70%</td><td>每个项目独立存储</td></tr><tr><td>安装速度</td><td>快 2-3 倍</td><td>较慢</td></tr><tr><td>Monorepo 支持</td><td>内置 workspace</td><td>NPM 7+ 支持</td></tr></tbody></table>',
    tags: ['对比', 'NPM', '性能']
  },
  'pnpm-add': {
    title: '添加依赖',
    body: '<p class="lead">使用 pnpm add 命令添加依赖，支持多种选项。</p><pre><code># 添加生产依赖\npnpm add lodash\npnpm add express --save-prod\n\n# 添加开发依赖\npnpm add jest --save-dev\n\n# 添加指定版本\npnpm add lodash@4.17.21\n\n# 添加到 workspace\npnpm add lodash --filter @myapp/web</code></pre>',
    tags: ['add', '依赖安装']
  },
  'pnpm-remove': {
    title: '移除依赖',
    body: '<p class="lead">使用 pnpm remove 命令移除不需要的依赖。</p><pre><code># 移除依赖\npnpm remove lodash\n\n# 移除开发依赖\npnpm remove jest --save-dev\n\n# 移除全局包\npnpm remove -g nodemon\n\n# 从 workspace 移除\npnpm remove lodash --filter @myapp/web</code></pre>',
    tags: ['remove', '卸载']
  },
  'pnpm-update': {
    title: '更新依赖',
    body: '<p class="lead">更新项目依赖到最新版本。</p><pre><code># 更新所有依赖\npnpm update\n\n# 更新指定包\npnpm update lodash\n\n# 检查哪些包可以更新\npnpm outdated\n\n# 交互式更新\npnpm up --interactive</code></pre>',
    tags: ['update', 'outdated']
  },
  'pnpm-link': {
    title: '链接本地包',
    body: '<p class="lead">在本地开发和测试包时，使用 link 命令创建符号链接。</p><pre><code># 在包目录下创建全局链接\ncd my-package\npnpm link --global\n\n# 在项目中使用\ncd my-project\npnpm link --global my-package\n\n# 直接链接本地路径\npnpm link ../my-package\n\n# 解除链接\npnpm unlink my-package</code></pre>',
    tags: ['link', '本地开发', '符号链接']
  },
  'pnpm-patch': {
    title: '补丁管理',
    body: '<p class="lead">PNPM 内置补丁功能，可以修改第三方包的源码。</p><pre><code># 创建补丁\npnpm patch lodash@4.17.21\n# 修改文件后执行\npnpm patch-commit /path/to/temp-dir\n\n# 在 package.json 中配置\n{\n  "pnpm": {\n    "patchedDependencies": {\n      "lodash@4.17.21": "patches/lodash@4.17.21.patch"\n    }\n  }\n}</code></pre>',
    tags: ['patch', '补丁', '修改源码']
  },
  'pnpm-workspace': {
    title: 'Workspace 配置',
    body: '<p class="lead">PNPM 内置 Monorepo 支持，通过 pnpm-workspace.yaml 配置文件。</p><pre><code># pnpm-workspace.yaml\npackages:\n  - \'packages/*\'\n  - \'apps/*\'\n\n# 添加 workspace 依赖\npnpm add lodash --filter @myapp/web\npnpm add shared@* --filter @myapp/web\n\n# 运行 workspace 脚本\npnpm run build --filter @myapp/web</code></pre>',
    tags: ['workspace', 'Monorepo']
  },
  'pnpm-filter': {
    title: '过滤命令',
    body: '<p class="lead">使用 --filter 参数可以对特定 workspace 执行命令。</p><pre><code># 按包名过滤\npnpm run build --filter @myapp/web\n\n# 按路径过滤\npnpm test --filter "./packages/**"\n\n# 包含依赖\npnpm build --filter "...@myapp/web"\n\n# 多个过滤条件\npnpm build --filter "@myapp/web" --filter "@myapp/admin"</code></pre>',
    tags: ['filter', '过滤', '批量操作']
  },
  'pnpm-catalog': {
    title: '目录版本管理',
    body: '<p class="lead">使用 catalog 统一管理 workspace 中的依赖版本。</p><pre><code># pnpm-workspace.yaml\ncatalog:\n  react: ^18.2.0\n  typescript: ~5.0.0\n\n# 在 package.json 中使用\n{\n  "dependencies": {\n    "react": "catalog:"\n  }\n}</code></pre>',
    tags: ['catalog', '版本管理']
  },
  'pnpm-publish': {
    title: '发布工作流',
    body: '<p class="lead">发布 workspace 中的包到 NPM 注册表。</p><pre><code># 发布所有变更的包\npnpm publish -r\n\n# 发布特定包\npnpm publish --filter @myapp/shared\n\n# 使用 changesets 管理版本\npnpm add -Dw @changesets/cli\npnpm changeset init\npnpm changeset\npnpm changeset version\npnpm publish -r</code></pre>',
    tags: ['publish', '发布', 'changesets']
  },
  'pnpm-store': {
    title: '全局存储',
    body: '<p class="lead">PNPM 使用全局内容寻址存储，所有项目共享相同版本的包。</p><pre><code># 查看存储位置\npnpm store path\n\n# 查看存储状态\npnpm store status\n\n# 修剪存储（删除未使用的包）\npnpm store prune\n\n# 存储路径配置\nstore-dir = ~/.pnpm-store</code></pre>',
    tags: ['store', '存储', '硬链接']
  },
  'pnpm-lockfile': {
    title: 'pnpm-lock.yaml',
    body: '<p class="lead">pnpm-lock.yaml 锁定依赖的精确版本，确保安装一致性。</p><pre><code># 更新 lockfile\npnpm update --lockfile-only\n\n# 重新生成 lockfile\nrm pnpm-lock.yaml\npnpm install\n\n# CI 环境中使用\npnpm install --frozen-lockfile</code></pre>',
    tags: ['lockfile', '锁定版本']
  },
  'pnpm-overrides': {
    title: '依赖覆盖',
    body: '<p class="lead">使用 overrides 强制指定依赖版本，解决版本冲突。</p><pre><code># package.json\n{\n  "pnpm": {\n    "overrides": {\n      "lodash": "4.17.21",\n      "webpack": "^5.0.0"\n    }\n  }\n}</code></pre>',
    tags: ['overrides', '依赖覆盖']
  },
  'pnpm-audit': {
    title: '安全审计',
    body: '<p class="lead">检查依赖中的已知安全漏洞。</p><pre><code># 扫描漏洞\npnpm audit\n\n# 自动修复\npnpm audit --fix\n\n# 查看详细报告\npnpm audit --json\n\n# 只检查生产依赖\npnpm audit --prod</code></pre>',
    tags: ['audit', '安全']
  },
  'pnpm-config': {
    title: '配置选项',
    body: '<p class="lead">PNPM 支持多种配置方式：命令行、.npmrc、环境变量。</p><pre><code># 查看配置\npnpm config list\n\n# 设置配置\npnpm config set store-dir ~/.pnpm-store\npnpm config set registry https://registry.npmmirror.com\n\n# .npmrc 配置示例\nstore-dir = ~/.pnpm-store\nstrict-peer-dependencies = true\nauto-install-peers = true</code></pre>',
    tags: ['配置', '.npmrc']
  },
  'pnpm-ci': {
    title: 'CI/CD 集成',
    body: '<p class="lead">在 CI/CD 环境中使用 PNPM 的最佳实践。</p><pre><code># GitHub Actions 示例\n- uses: pnpm/action-setup@v2\n  with:\n    version: 8\n- uses: actions/setup-node@v3\n  with:\n    node-version: \'18\'\n    cache: \'pnpm\'\n- run: pnpm install --frozen-lockfile</code></pre>',
    tags: ['CI/CD', 'GitHub Actions', '缓存']
  },
  'pnpm-mirror': {
    title: '镜像与缓存',
    body: '<p class="lead">配置镜像源加速安装，管理缓存提高效率。</p><pre><code># 设置镜像源\npnpm config set registry https://registry.npmmirror.com\n\n# 配置缓存\npnpm config set store-dir ~/.pnpm-store\n\n# 清理缓存\npnpm store prune\n\n# 离线安装\npnpm install --offline</code></pre>',
    tags: ['镜像', '缓存', '加速']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 PNPM 官方文档获取更多信息。</p>',
        tags: ['PNPM', '包管理']
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

addLink('pnpm-intro', 'pnpm-install')
addLink('pnpm-install', 'pnpm-basics')
addLink('pnpm-intro', 'pnpm-vs-npm')
addLink('pnpm-basics', 'pnpm-add')
addLink('pnpm-add', 'pnpm-remove')
addLink('pnpm-add', 'pnpm-update')
addLink('pnpm-workspace', 'pnpm-filter')
addLink('pnpm-workspace', 'pnpm-catalog')
addLink('pnpm-workspace', 'pnpm-publish')
addLink('pnpm-store', 'pnpm-lockfile')
addLink('pnpm-store', 'pnpm-config')
addLink('pnpm-patch', 'pnpm-patch')
addLink('pnpm-audit', 'pnpm-ci')
addLink('pnpm-ci', 'pnpm-mirror')
addLink('pnpm-link', 'pnpm-publish')

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