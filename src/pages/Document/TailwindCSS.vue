<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Tailwind CSS 知识库</h1>
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
          <h2>🎨 <span class="gradient-text">Tailwind CSS 完全指南</span></h2>
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
          <p>🎨 实用优先的 CSS 框架 | 原子化 CSS</p>
          <p>✨ 点击节点双向联动 | 快速构建现代界面</p>
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
          <h3>🔗 Tailwind CSS 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Tailwind用户'
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

// ========== Tailwind CSS 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'tw-intro', label: 'Tailwind CSS 简介', hot: true },
      { id: 'tw-install', label: '安装与配置', hot: true },
      { id: 'tw-core-concepts', label: '核心概念', hot: true },
      { id: 'tw-utility-first', label: '实用优先', hot: true }
    ]},
  { title: '🎨 布局与间距', items: [
      { id: 'tw-flex', label: 'Flexbox', hot: true },
      { id: 'tw-grid', label: 'Grid 网格', hot: true },
      { id: 'tw-spacing', label: '间距系统', hot: true },
      { id: 'tw-sizing', label: '尺寸设置', hot: true },
      { id: 'tw-position', label: '定位', hot: true }
    ]},
  { title: '🌈 样式与外观', items: [
      { id: 'tw-colors', label: '颜色系统', hot: true },
      { id: 'tw-typography', label: '排版', hot: true },
      { id: 'tw-background', label: '背景', hot: true },
      { id: 'tw-border', label: '边框', hot: true },
      { id: 'tw-effects', label: '阴影与效果', hot: true }
    ]},
  { title: '⚡ 交互与响应式', items: [
      { id: 'tw-hover-focus', label: '悬停/焦点状态', hot: true },
      { id: 'tw-responsive', label: '响应式设计', hot: true },
      { id: 'tw-dark-mode', label: '暗色模式', hot: true },
      { id: 'tw-transitions', label: '过渡与动画', hot: true }
    ]},
  { title: '🔧 高级特性', items: [
      { id: 'tw-customization', label: '自定义配置', hot: true },
      { id: 'tw-theme', label: '主题系统', hot: true },
      { id: 'tw-plugins', label: '插件开发', hot: true },
      { id: 'tw-arbitrary', label: '任意值', hot: true },
      { id: 'tw-variants', label: '变体', hot: true }
    ]},
  { title: '🛠️ 工具与生态', items: [
      { id: 'tw-prefix', label: '前缀与组织', hot: true },
      { id: 'tw-optimization', label: '生产优化', hot: true },
      { id: 'tw-integration', label: '框架集成', hot: true }
    ]}
])

const selectedId = ref('tw-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Tailwind CSS 内容映射表 ==========
const contentMap = {
  'tw-intro': {
    title: 'Tailwind CSS 简介',
    body: '<p class="lead">Tailwind CSS 是一个实用优先的 CSS 框架，通过提供低级别的工具类来快速构建自定义设计，无需编写自定义 CSS。</p><h3>核心特点</h3><ul><li><strong>实用优先</strong>：使用原子类组合构建界面</li><li><strong>高度可定制</strong>：完全可配置的设计系统</li><li><strong>响应式设计</strong>：内置响应式变体</li><li><strong>暗色模式</strong>：原生支持暗色主题</li><li><strong>零运行时</strong>：编译后生成纯 CSS，无运行时开销</li></ul><div class="note">💡 Tailwind CSS 由 Adam Wathan 创建，是目前最流行的 CSS 框架之一。</div>',
    tags: ['CSS框架', '原子化', '实用优先']
  },
  'tw-install': {
    title: '安装与配置',
    body: '<p class="lead">Tailwind CSS 可以通过 npm 安装，支持多种构建工具集成。</p><pre><code># 使用 npm 安装\nnpm install -D tailwindcss postcss autoprefixer\n\n# 初始化配置\nnpx tailwindcss init\n\n# 创建配置文件 tailwind.config.js\nmodule.exports = {\n  content: ["./src/**/*.{html,js,vue,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: []\n}\n\n# 在主 CSS 文件中引入\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n# 构建命令\nnpx tailwindcss -i ./src/input.css -o ./dist/output.css --watch</code></pre>',
    tags: ['安装', '配置', 'CLI']
  },
  'tw-core-concepts': {
    title: '核心概念',
    body: '<p class="lead">理解 Tailwind CSS 的核心概念和工作原理。</p><pre><code>// 传统 CSS 方式\n&lt;div class="card"&gt;\n  &lt;h1 class="card-title"&gt;标题&lt;/h1&gt;\n&lt;/div&gt;\n\n.card {\n  padding: 1rem;\n  border-radius: 0.5rem;\n  box-shadow: 0 4px 6px rgba(0,0,0,0.1);\n}\n.card-title {\n  font-size: 1.25rem;\n  font-weight: bold;\n}\n\n// Tailwind 方式\n&lt;div class="p-4 rounded-lg shadow-md"&gt;\n  &lt;h1 class="text-xl font-bold"&gt;标题&lt;/h1&gt;\n&lt;/div&gt;\n\n// 三层结构\n// base: 重置样式\n// components: 组件类（可自定义）\n// utilities: 工具类</code></pre>',
    tags: ['概念', '工具类', '组件']
  },
  'tw-utility-first': {
    title: '实用优先',
    body: '<p class="lead">实用优先意味着使用预定义的原子类组合，而不是编写自定义 CSS。</p><pre><code>// 传统方式 - 编写自定义 CSS\n&lt;div class="card"&gt;...&lt;/div&gt;\n\n.card {\n  background: white;\n  border-radius: 8px;\n  padding: 16px;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}\n\n// Tailwind 方式 - 使用工具类组合\n&lt;div class="bg-white rounded-lg p-4 shadow-md"&gt;...&lt;/div&gt;\n\n// 优势\n// 1. 无需命名类\n// 2. CSS 体积固定\n// 3. 修改安全（不影响其他地方）\n// 4. 设计系统一致性</code></pre>',
    tags: ['实用优先', '原子类', '组合']
  },
  'tw-flex': {
    title: 'Flexbox',
    body: '<p class="lead">Tailwind 提供完整的 Flexbox 工具类。</p><pre><code>&lt;!-- 启用 Flex --&gt;\n&lt;div class="flex"&gt;...&lt;/div&gt;\n&lt;div class="inline-flex"&gt;...&lt;/div&gt;\n\n&lt;!-- 方向 --&gt;\n&lt;div class="flex-row"&gt;...&lt;/div&gt;\n&lt;div class="flex-col"&gt;...&lt;/div&gt;\n\n&lt;!-- 主轴对齐 --&gt;\n&lt;div class="justify-start"&gt;...&lt;/div&gt;\n&lt;div class="justify-center"&gt;...&lt;/div&gt;\n&lt;div class="justify-between"&gt;...&lt;/div&gt;\n&lt;div class="justify-around"&gt;...&lt;/div&gt;\n&lt;div class="justify-evenly"&gt;...&lt;/div&gt;\n\n&lt;!-- 交叉轴对齐 --&gt;\n&lt;div class="items-start"&gt;...&lt;/div&gt;\n&lt;div class="items-center"&gt;...&lt;/div&gt;\n&lt;div class="items-end"&gt;...&lt;/div&gt;\n\n&lt;!-- 换行 --&gt;\n&lt;div class="flex-wrap"&gt;...&lt;/div&gt;\n\n&lt;!-- 间隙 --&gt;\n&lt;div class="flex gap-4"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['Flex', '布局', '弹性盒子']
  },
  'tw-grid': {
    title: 'Grid 网格',
    body: '<p class="lead">Tailwind 提供强大的 Grid 布局工具类。</p><pre><code>&lt;!-- 启用 Grid --&gt;\n&lt;div class="grid"&gt;...&lt;/div&gt;\n\n&lt;!-- 列定义 --&gt;\n&lt;div class="grid-cols-3"&gt;...&lt;/div&gt;\n&lt;div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"&gt;...&lt;/div&gt;\n\n&lt;!-- 行定义 --&gt;\n&lt;div class="grid-rows-3"&gt;...&lt;/div&gt;\n\n&lt;!-- 跨度 --&gt;\n&lt;div class="col-span-2"&gt;...&lt;/div&gt;\n&lt;div class="row-span-2"&gt;...&lt;/div&gt;\n\n&lt;!-- 起始位置 --&gt;\n&lt;div class="col-start-2 col-end-4"&gt;...&lt;/div&gt;\n\n&lt;!-- 间隙 --&gt;\n&lt;div class="grid gap-4"&gt;...&lt;/div&gt;\n&lt;div class="grid gap-x-4 gap-y-2"&gt;...&lt;/div&gt;\n\n&lt;!-- 自动填充 --&gt;\n&lt;div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))]"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['Grid', '网格布局', '响应式']
  },
  'tw-spacing': {
    title: '间距系统',
    body: '<p class="lead">Tailwind 使用基于 rem 的间距系统，默认从 0.25rem 开始。</p><pre><code>&lt;!-- Padding --&gt;\n&lt;div class="p-4"&gt;...&lt;/div&gt;        &lt;!-- 1rem --&gt;\n&lt;div class="px-4"&gt;...&lt;/div&gt;       &lt;!-- 水平 --&gt;\n&lt;div class="py-2"&gt;...&lt;/div&gt;       &lt;!-- 垂直 --&gt;\n&lt;div class="pt-6"&gt;...&lt;/div&gt;       &lt;!-- 上 --&gt;\n&lt;div class="pr-8"&gt;...&lt;/div&gt;       &lt;!-- 右 --&gt;\n&lt;div class="pb-10"&gt;...&lt;/div&gt;      &lt;!-- 下 --&gt;\n&lt;div class="pl-12"&gt;...&lt;/div&gt;      &lt;!-- 左 --&gt;\n\n&lt;!-- Margin --&gt;\n&lt;div class="m-4"&gt;...&lt;/div&gt;\n&lt;div class="mx-auto"&gt;...&lt;/div&gt;   &lt;!-- 水平居中 --&gt;\n&lt;div class="my-4"&gt;...&lt;/div&gt;\n\n&lt;!-- 负边距 --&gt;\n&lt;div class="-mt-4"&gt;...&lt;/div&gt;\n\n&lt;!-- 间距值 --&gt;\n// 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96</code></pre>',
    tags: ['间距', 'padding', 'margin']
  },
  'tw-sizing': {
    title: '尺寸设置',
    body: '<p class="lead">Tailwind 提供宽度、高度等尺寸工具类。</p><pre><code>&lt;!-- 宽度 --&gt;\n&lt;div class="w-full"&gt;...&lt;/div&gt;     &lt;!-- 100% --&gt;\n&lt;div class="w-screen"&gt;...&lt;/div&gt;   &lt;!-- 视口宽度 --&gt;\n&lt;div class="w-1/2"&gt;...&lt;/div&gt;      &lt;!-- 50% --&gt;\n&lt;div class="w-64"&gt;...&lt;/div&gt;       &lt;!-- 固定宽度 --&gt;\n&lt;div class="w-auto"&gt;...&lt;/div&gt;\n&lt;div class="min-w-0"&gt;...&lt;/div&gt;\n&lt;div class="max-w-md"&gt;...&lt;/div&gt;\n\n&lt;!-- 高度 --&gt;\n&lt;div class="h-full"&gt;...&lt;/div&gt;\n&lt;div class="h-screen"&gt;...&lt;/div&gt;\n&lt;div class="h-32"&gt;...&lt;/div&gt;\n&lt;div class="min-h-screen"&gt;...&lt;/div&gt;\n\n&lt;!-- 响应式尺寸 --&gt;\n&lt;div class="w-full md:w-1/2 lg:w-1/3"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['尺寸', '宽度', '高度']
  },
  'tw-position': {
    title: '定位',
    body: '<p class="lead">Tailwind 提供完整的定位工具类。</p><pre><code>&lt;!-- 定位类型 --&gt;\n&lt;div class="static"&gt;...&lt;/div&gt;\n&lt;div class="relative"&gt;...&lt;/div&gt;\n&lt;div class="absolute"&gt;...&lt;/div&gt;\n&lt;div class="fixed"&gt;...&lt;/div&gt;\n&lt;div class="sticky"&gt;...&lt;/div&gt;\n\n&lt;!-- 位置偏移 --&gt;\n&lt;div class="top-0"&gt;...&lt;/div&gt;\n&lt;div class="right-4"&gt;...&lt;/div&gt;\n&lt;div class="bottom-auto"&gt;...&lt;/div&gt;\n&lt;div class="left-1/2"&gt;...&lt;/div&gt;\n\n&lt;!-- 居中技巧 --&gt;\n&lt;div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"&gt;\n  完全居中\n&lt;/div&gt;\n\n&lt;!-- Z-index --&gt;\n&lt;div class="z-0"&gt;...&lt;/div&gt;\n&lt;div class="z-10"&gt;...&lt;/div&gt;\n&lt;div class="z-50"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['定位', 'absolute', 'relative']
  },
  'tw-colors': {
    title: '颜色系统',
    body: '<p class="lead">Tailwind 提供丰富的颜色调色板。</p><pre><code>&lt;!-- 文字颜色 --&gt;\n&lt;h1 class="text-red-500"&gt;红色文字&lt;/h1&gt;\n&lt;h1 class="text-blue-600"&gt;蓝色文字&lt;/h1&gt;\n&lt;h1 class="text-gray-900"&gt;深灰色&lt;/h1&gt;\n\n&lt;!-- 背景颜色 --&gt;\n&lt;div class="bg-green-100"&gt;浅绿背景&lt;/div&gt;\n&lt;div class="bg-yellow-500"&gt;黄色背景&lt;/div&gt;\n\n&lt;!-- 边框颜色 --&gt;\n&lt;div class="border border-purple-400"&gt;紫色边框&lt;/div&gt;\n\n&lt;!-- 颜色级别 --&gt;\n// 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950\n\n&lt;!-- 透明度 --&gt;\n&lt;div class="bg-black/50"&gt;50% 透明度黑色&lt;/div&gt;\n&lt;div class="text-white/75"&gt;75% 透明度白色文字&lt;/div&gt;</code></pre>',
    tags: ['颜色', '调色板', '透明度']
  },
  'tw-typography': {
    title: '排版',
    body: '<p class="lead">Tailwind 提供完整的文字排版工具类。</p><pre><code>&lt;!-- 字体大小 --&gt;\n&lt;p class="text-xs"&gt;极小&lt;/p&gt;\n&lt;p class="text-sm"&gt;小&lt;/p&gt;\n&lt;p class="text-base"&gt;基础&lt;/p&gt;\n&lt;p class="text-lg"&gt;大&lt;/p&gt;\n&lt;p class="text-xl"&gt;特大&lt;/p&gt;\n&lt;p class="text-2xl"&gt;2xl&lt;/p&gt;\n&lt;p class="text-4xl"&gt;4xl&lt;/p&gt;\n\n&lt;!-- 字体粗细 --&gt;\n&lt;p class="font-light"&gt;细体&lt;/p&gt;\n&lt;p class="font-normal"&gt;正常&lt;/p&gt;\n&lt;p class="font-medium"&gt;中等&lt;/p&gt;\n&lt;p class="font-bold"&gt;粗体&lt;/p&gt;\n&lt;p class="font-black"&gt;特粗&lt;/p&gt;\n\n&lt;!-- 行高 --&gt;\n&lt;p class="leading-none"&gt;紧凑&lt;/p&gt;\n&lt;p class="leading-tight"&gt;较紧&lt;/p&gt;\n&lt;p class="leading-normal"&gt;正常&lt;/p&gt;\n&lt;p class="leading-loose"&gt;宽松&lt;/p&gt;\n\n&lt;!-- 对齐 --&gt;\n&lt;p class="text-left"&gt;左对齐&lt;/p&gt;\n&lt;p class="text-center"&gt;居中&lt;/p&gt;\n&lt;p class="text-right"&gt;右对齐&lt;/p&gt;</code></pre>',
    tags: ['字体', '排版', '文字']
  },
  'tw-background': {
    title: '背景',
    body: '<p class="lead">Tailwind 提供丰富的背景工具类。</p><pre><code>&lt;!-- 背景颜色 --&gt;\n&lt;div class="bg-gray-100"&gt;...&lt;/div&gt;\n\n&lt;!-- 背景渐变 --&gt;\n&lt;div class="bg-gradient-to-r from-blue-500 to-purple-600"&gt;\n  渐变背景\n&lt;/div&gt;\n\n&lt;!-- 背景图片 --&gt;\n&lt;div class="bg-cover bg-center" style="background-image: url(...)"&gt;\n  ...\n&lt;/div&gt;\n\n&lt;!-- 背景位置 --&gt;\n&lt;div class="bg-top"&gt;...&lt;/div&gt;\n&lt;div class="bg-center"&gt;...&lt;/div&gt;\n&lt;div class="bg-bottom"&gt;...&lt;/div&gt;\n\n&lt;!-- 背景大小 --&gt;\n&lt;div class="bg-cover"&gt;...&lt;/div&gt;\n&lt;div class="bg-contain"&gt;...&lt;/div&gt;\n\n&lt;!-- 背景重复 --&gt;\n&lt;div class="bg-repeat"&gt;...&lt;/div&gt;\n&lt;div class="bg-no-repeat"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['背景', '渐变', '图片']
  },
  'tw-border': {
    title: '边框',
    body: '<p class="lead">Tailwind 提供完整的边框工具类。</p><pre><code>&lt;!-- 边框宽度 --&gt;\n&lt;div class="border"&gt;...&lt;/div&gt;\n&lt;div class="border-2"&gt;...&lt;/div&gt;\n&lt;div class="border-t"&gt;上边框&lt;/div&gt;\n&lt;div class="border-r-2"&gt;右边框&lt;/div&gt;\n\n&lt;!-- 边框颜色 --&gt;\n&lt;div class="border border-red-500"&gt;...&lt;/div&gt;\n\n&lt;!-- 圆角 --&gt;\n&lt;div class="rounded"&gt;...&lt;/div&gt;\n&lt;div class="rounded-lg"&gt;大圆角&lt;/div&gt;\n&lt;div class="rounded-full"&gt;圆形&lt;/div&gt;\n&lt;div class="rounded-t-lg"&gt;顶部圆角&lt;/div&gt;\n\n&lt;!-- 边框样式 --&gt;\n&lt;div class="border-solid"&gt;实线&lt;/div&gt;\n&lt;div class="border-dashed"&gt;虚线&lt;/div&gt;\n&lt;div class="border-dotted"&gt;点线&lt;/div&gt;\n&lt;div class="border-none"&gt;无边框&lt;/div&gt;</code></pre>',
    tags: ['边框', '圆角', 'border']
  },
  'tw-effects': {
    title: '阴影与效果',
    body: '<p class="lead">Tailwind 提供阴影、模糊等视觉效果工具类。</p><pre><code>&lt;!-- 阴影 --&gt;\n&lt;div class="shadow-sm"&gt;小阴影&lt;/div&gt;\n&lt;div class="shadow"&gt;标准阴影&lt;/div&gt;\n&lt;div class="shadow-md"&gt;中等阴影&lt;/div&gt;\n&lt;div class="shadow-lg"&gt;大阴影&lt;/div&gt;\n&lt;div class="shadow-xl"&gt;特大阴影&lt;/div&gt;\n&lt;div class="shadow-2xl"&gt;超大阴影&lt;/div&gt;\n&lt;div class="shadow-inner"&gt;内阴影&lt;/div&gt;\n&lt;div class="shadow-none"&gt;无阴影&lt;/div&gt;\n\n&lt;!-- 模糊/滤镜 --&gt;\n&lt;div class="blur-sm"&gt;轻微模糊&lt;/div&gt;\n&lt;div class="blur"&gt;模糊&lt;/div&gt;\n&lt;div class="opacity-50"&gt;50% 透明度&lt;/div&gt;\n\n&lt;!-- 混合模式 --&gt;\n&lt;div class="mix-blend-multiply"&gt;正片叠底&lt;/div&gt;</code></pre>',
    tags: ['阴影', '模糊', '效果']
  },
  'tw-hover-focus': {
    title: '悬停/焦点状态',
    body: '<p class="lead">Tailwind 支持悬停、焦点等状态变体。</p><pre><code>&lt;!-- 悬停状态 --&gt;\n&lt;button class="bg-blue-500 hover:bg-blue-700"&gt;悬停变深&lt;/button&gt;\n\n&lt;!-- 焦点状态 --&gt;\n&lt;input class="focus:outline-none focus:ring-2 focus:ring-blue-500" /&gt;\n\n&lt;!-- 激活状态 --&gt;\n&lt;button class="active:bg-blue-800"&gt;点击时&lt;/button&gt;\n\n&lt;!-- 禁用状态 --&gt;\n&lt;button disabled class="disabled:opacity-50"&gt;禁用按钮&lt;/button&gt;\n\n&lt;!-- 组合状态 --&gt;\n&lt;button class="hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 active:bg-blue-800"&gt;\n  多状态按钮\n&lt;/button&gt;\n\n&lt;!-- 组悬停 --&gt;\n&lt;div class="group hover:bg-gray-100"&gt;\n  &lt;p class="group-hover:text-blue-500"&gt;悬停时变蓝&lt;/p&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['悬停', '焦点', '状态']
  },
  'tw-responsive': {
    title: '响应式设计',
    body: '<p class="lead">Tailwind 使用断点前缀实现响应式设计。</p><pre><code>&lt;!-- 断点前缀 --&gt;\n// sm: 640px  移动端横屏\n// md: 768px  平板\n// lg: 1024px 桌面\n// xl: 1280px 大桌面\n// 2xl: 1536px 超大桌面\n\n&lt;!-- 移动优先设计 --&gt;\n&lt;div class="text-sm md:text-base lg:text-lg"&gt;\n  响应式文字大小\n&lt;/div&gt;\n\n&lt;div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"&gt;\n  响应式网格\n&lt;/div&gt;\n\n&lt;div class="w-full md:w-1/2 lg:w-1/3"&gt;\n  响应式宽度\n&lt;/div&gt;\n\n&lt;div class="hidden md:block"&gt;\n  在移动端隐藏，平板上显示\n&lt;/div&gt;</code></pre>',
    tags: ['响应式', '断点', '移动优先']
  },
  'tw-dark-mode': {
    title: '暗色模式',
    body: '<p class="lead">Tailwind 原生支持暗色模式变体。</p><pre><code>&lt;!-- 启用暗色模式（tailwind.config.js）--&gt;\nmodule.exports = {\n  darkMode: "class"  // 或 "media"\n}\n\n&lt;!-- 使用暗色模式变体 --&gt;\n&lt;div class="bg-white dark:bg-gray-800"&gt;\n  &lt;h1 class="text-gray-900 dark:text-white"&gt;标题&lt;/h1&gt;\n  &lt;p class="text-gray-600 dark:text-gray-300"&gt;内容&lt;/p&gt;\n&lt;/div&gt;\n\n&lt;!-- 切换暗色模式 --&gt;\n&lt;button onclick="document.documentElement.classList.toggle(\'dark\')"&gt;\n  切换暗色模式\n&lt;/button&gt;\n\n&lt;!-- 暗色模式下的悬停 --&gt;\n&lt;button class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"&gt;\n  按钮\n&lt;/button&gt;</code></pre>',
    tags: ['暗色模式', 'dark', '主题']
  },
  'tw-transitions': {
    title: '过渡与动画',
    body: '<p class="lead">Tailwind 提供过渡和动画工具类。</p><pre><code>&lt;!-- 过渡属性 --&gt;\n&lt;button class="transition duration-300 ease-in-out"&gt;\n  平滑过渡\n&lt;/button&gt;\n\n&lt;!-- 过渡时长 --&gt;\n&lt;div class="duration-75"&gt;75ms&lt;/div&gt;\n&lt;div class="duration-150"&gt;150ms&lt;/div&gt;\n&lt;div class="duration-300"&gt;300ms&lt;/div&gt;\n&lt;div class="duration-500"&gt;500ms&lt;/div&gt;\n&lt;div class="duration-1000"&gt;1000ms&lt;/div&gt;\n\n&lt;!-- 过渡缓动 --&gt;\n&lt;div class="ease-linear"&gt;线性&lt;/div&gt;\n&lt;div class="ease-in"&gt;加速&lt;/div&gt;\n&lt;div class="ease-out"&gt;减速&lt;/div&gt;\n&lt;div class="ease-in-out"&gt;先加速后减速&lt;/div&gt;\n\n&lt;!-- 过渡属性 --&gt;\n&lt;div class="transition-all"&gt;所有属性&lt;/div&gt;\n&lt;div class="transition-colors"&gt;颜色属性&lt;/div&gt;\n&lt;div class="transition-transform"&gt;变换属性&lt;/div&gt;\n\n&lt;!-- 动画 --&gt;\n&lt;div class="animate-pulse"&gt;脉冲动画&lt;/div&gt;\n&lt;div class="animate-spin"&gt;旋转动画&lt;/div&gt;\n&lt;div class="animate-bounce"&gt;弹跳动画&lt;/div&gt;</code></pre>',
    tags: ['过渡', '动画', 'duration']
  },
  'tw-customization': {
    title: '自定义配置',
    body: '<p class="lead">通过 tailwind.config.js 自定义主题和功能。</p><pre><code>// tailwind.config.js\nmodule.exports = {\n  content: ["./src/**/*.{html,js,vue}"],\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n          light: "#4f46e5",\n          DEFAULT: "#4338ca",\n          dark: "#3730a3"\n        }\n      },\n      spacing: {\n        "18": "4.5rem",\n        "88": "22rem"\n      },\n      fontSize: {\n        "xxl": ["2rem", { lineHeight: "2.5rem" }]\n      },\n      screens: {\n        "3xl": "1600px"\n      },\n      animation: {\n        "fade-in": "fadeIn 0.5s ease-in-out"\n      },\n      keyframes: {\n        fadeIn: {\n          "0%": { opacity: "0" },\n          "100%": { opacity: "1" }\n        }\n      }\n    }\n  }\n}</code></pre>',
    tags: ['自定义', '配置', '扩展']
  },
  'tw-theme': {
    title: '主题系统',
    body: '<p class="lead">Tailwind 的主题系统允许完全控制设计令牌。</p><pre><code>// theme 配置项\nmodule.exports = {\n  theme: {\n    // 覆盖默认主题\n    fontFamily: {\n      sans: ["Inter", "system-ui", "sans-serif"],\n      mono: ["Fira Code", "monospace"]\n    },\n    \n    // 自定义断点\n    screens: {\n      tablet: "640px",\n      laptop: "1024px",\n      desktop: "1280px"\n    },\n    \n    // 扩展默认主题\n    extend: {\n      borderRadius: {\n        "xl": "1rem"\n      },\n      boxShadow: {\n        "glow": "0 0 15px rgba(0,0,0,0.1)"\n      }\n    }\n  }\n}\n\n// 在模板中使用\n&lt;div class="font-sans rounded-xl shadow-glow"&gt;...&lt;/div&gt;</code></pre>',
    tags: ['主题', '设计令牌', '配置']
  },
  'tw-plugins': {
    title: '插件开发',
    body: '<p class="lead">Tailwind 插件允许扩展框架功能。</p><pre><code>// 创建插件\nconst plugin = require("tailwindcss/plugin")\n\nmodule.exports = plugin(function({ addUtilities, addComponents, addBase, theme }) {\n  // 添加基础样式\n  addBase({\n    "h1": { fontSize: theme("fontSize.2xl") },\n    "a": { color: theme("colors.blue.500") }\n  })\n  \n  // 添加组件类\n  addComponents({\n    ".card": {\n      padding: theme("spacing.4"),\n      borderRadius: theme("borderRadius.lg"),\n      boxShadow: theme("boxShadow.md")\n    }\n  })\n  \n  // 添加工具类\n  addUtilities({\n    ".text-shadow": {\n      textShadow: "2px 2px 4px rgba(0,0,0,0.1)"\n    }\n  })\n})\n\n// 使用插件\nmodule.exports = {\n  plugins: [require("./my-plugin.js")]\n}</code></pre>',
    tags: ['插件', '扩展', '自定义']
  },
  'tw-arbitrary': {
    title: '任意值',
    body: '<p class="lead">Tailwind 支持使用方括号设置任意值。</p><pre><code>&lt;!-- 任意宽度 --&gt;\n&lt;div class="w-[137px]"&gt;137px 宽度&lt;/div&gt;\n&lt;div class="w-[calc(100%-2rem)]"&gt;计算宽度&lt;/div&gt;\n\n&lt;!-- 任意颜色 --&gt;\n&lt;div class="bg-[#ff5733]"&gt;自定义颜色&lt;/div&gt;\n&lt;div class="text-[color:var(--my-color)]"&gt;CSS 变量&lt;/div&gt;\n\n&lt;!-- 任意间距 --&gt;\n&lt;div class="p-[23px]"&gt;23px 内边距&lt;/div&gt;\n&lt;div class="mt-[15%]"&gt;15% 上边距&lt;/div&gt;\n\n&lt;!-- 任意阴影 --&gt;\n&lt;div class="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"&gt;\n  自定义阴影\n&lt;/div&gt;\n\n&lt;!-- 任意 Grid --&gt;\n&lt;div class="grid-cols-[200px,1fr,100px]"&gt;自定义列宽&lt;/div&gt;</code></pre>',
    tags: ['任意值', '自定义', '方括号']
  },
  'tw-variants': {
    title: '变体',
    body: '<p class="lead">变体允许在不同状态下使用工具类。</p><pre><code>&lt;!-- 内置变体 --&gt;\n// hover: 悬停\n// focus: 焦点\n// active: 激活\n// disabled: 禁用\n// group-hover: 组悬停\n// focus-within: 内部焦点\n// first/last/odd/even: 子元素选择\n\n&lt;!-- 使用示例 --&gt;\n&lt;div class="first:mt-0 last:mb-0 odd:bg-gray-100"&gt;\n  &lt;div&gt;第一项&lt;/div&gt;\n  &lt;div&gt;第二项&lt;/div&gt;\n  &lt;div&gt;第三项&lt;/div&gt;\n&lt;/div&gt;\n\n&lt;div class="focus-within:border-blue-500"&gt;\n  &lt;input type="text" placeholder="输入时边框变蓝" /&gt;\n&lt;/div&gt;\n\n&lt;!-- 自定义变体 --&gt;\nmodule.exports = {\n  variants: {\n    extend: {\n      backgroundColor: ["active"],\n      opacity: ["disabled"]\n    }\n  }\n}</code></pre>',
    tags: ['变体', '状态', '伪类']
  },
  'tw-prefix': {
    title: '前缀与组织',
    body: '<p class="lead">使用前缀避免类名冲突和组织代码。</p><pre><code>// tailwind.config.js\nmodule.exports = {\n  prefix: "tw-",\n  important: true\n}\n\n// 使用带前缀的类\n&lt;div class="tw-flex tw-p-4 tw-bg-white"&gt;...&lt;/div&gt;\n\n// 使用 @layer 组织自定义 CSS\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@layer components {\n  .btn {\n    @apply px-4 py-2 rounded-lg font-semibold;\n  }\n  .btn-primary {\n    @apply bg-blue-500 text-white hover:bg-blue-600;\n  }\n}\n\n@layer utilities {\n  .scrollbar-hide {\n    -ms-overflow-style: none;\n    scrollbar-width: none;\n  }\n}</code></pre>',
    tags: ['前缀', '组织', '@apply']
  },
  'tw-optimization': {
    title: '生产优化',
    body: '<p class="lead">生产环境优化和构建配置。</p><pre><code>// tailwind.config.js - 确保 content 路径正确\nmodule.exports = {\n  content: [\n    "./src/**/*.{html,js,jsx,ts,tsx,vue}",\n    "./public/index.html"\n  ]\n}\n\n// package.json - 构建脚本\n{\n  "scripts": {\n    "build": "NODE_ENV=production tailwindcss -i ./src/input.css -o ./dist/output.css --minify"\n  }\n}\n\n// PostCSS 配置\nmodule.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {})\n  }\n}\n\n// 优化结果\n// - 未使用的样式被移除\n// - CSS 被压缩\n// - 最终文件很小</code></pre>',
    tags: ['优化', '生产', '构建']
  },
  'tw-integration': {
    title: '框架集成',
    body: '<p class="lead">Tailwind CSS 与主流框架的集成方式。</p><pre><code>// Vue 3 集成\n// main.js\nimport "tailwindcss/tailwind.css"\n\n// Vue 组件\n&lt;template&gt;\n  &lt;div class="p-4 bg-gray-100"&gt;\n    &lt;h1 class="text-2xl font-bold text-blue-600"&gt;Hello Vue&lt;/h1&gt;\n  &lt;/div&gt;\n&lt;/template&gt;\n\n// React 集成\n// index.css\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n// App.js\nfunction App() {\n  return (\n    &lt;div className="p-4 bg-gray-100"&gt;\n      &lt;h1 className="text-2xl font-bold text-blue-600"&gt;Hello React&lt;/h1&gt;\n    &lt;/div&gt;\n  )\n}\n\n// Next.js 集成\n// next.config.js\nmodule.exports = {\n  experimental: {\n    optimizeCss: true\n  }\n}</code></pre>',
    tags: ['集成', 'Vue', 'React']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Tailwind CSS 官方文档获取更多信息。</p>',
        tags: ['TailwindCSS', 'CSS框架']
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

addLink('tw-intro', 'tw-install')
addLink('tw-install', 'tw-core-concepts')
addLink('tw-core-concepts', 'tw-utility-first')
addLink('tw-flex', 'tw-grid')
addLink('tw-grid', 'tw-spacing')
addLink('tw-spacing', 'tw-sizing')
addLink('tw-sizing', 'tw-position')
addLink('tw-colors', 'tw-typography')
addLink('tw-typography', 'tw-background')
addLink('tw-background', 'tw-border')
addLink('tw-border', 'tw-effects')
addLink('tw-hover-focus', 'tw-responsive')
addLink('tw-responsive', 'tw-dark-mode')
addLink('tw-dark-mode', 'tw-transitions')
addLink('tw-customization', 'tw-theme')
addLink('tw-theme', 'tw-plugins')
addLink('tw-plugins', 'tw-arbitrary')
addLink('tw-arbitrary', 'tw-variants')
addLink('tw-prefix', 'tw-optimization')
addLink('tw-optimization', 'tw-integration')

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