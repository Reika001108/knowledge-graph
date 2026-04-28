<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">页面样式知识库</h1>
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
          <h2>🎨 <span class="gradient-text">页面样式完全指南</span></h2>
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
          <p>🎨 CSS 样式设计 | 打造精美的用户界面</p>
          <p>✨ 点击节点双向联动 | 从基础到高级</p>
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
          <h3>🔗 页面样式知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || '样式开发者'
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

// ========== 页面样式导航数据 ==========
const navSections = ref([
  { title: '📖 CSS 基础', items: [
      { id: 'css-intro', label: 'CSS 简介', hot: true },
      { id: 'selectors', label: '选择器', hot: true },
      { id: 'box-model', label: '盒模型', hot: true },
      { id: 'units', label: '单位与数值', hot: true }
    ]},
  { title: '🎨 视觉样式', items: [
      { id: 'colors', label: '颜色与背景', hot: true },
      { id: 'typography', label: '字体与文本', hot: true },
      { id: 'borders', label: '边框与圆角', hot: true },
      { id: 'shadows', label: '阴影效果', hot: true },
      { id: 'gradients', label: '渐变效果', hot: true }
    ]},
  { title: '📐 布局', items: [
      { id: 'display', label: 'Display 显示', hot: true },
      { id: 'position', label: '定位', hot: true },
      { id: 'flexbox', label: 'Flex 弹性布局', hot: true },
      { id: 'grid', label: 'Grid 网格布局', hot: true },
      { id: 'float', label: '浮动', hot: true }
    ]},
  { title: '📱 响应式设计', items: [
      { id: 'media-queries', label: '媒体查询', hot: true },
      { id: 'viewport', label: '视口设置', hot: true },
      { id: 'responsive-units', label: '响应式单位', hot: true },
      { id: 'mobile-first', label: '移动优先', hot: true }
    ]},
  { title: '✨ 动画与过渡', items: [
      { id: 'transitions', label: '过渡效果', hot: true },
      { id: 'animations', label: '关键帧动画', hot: true },
      { id: 'transforms', label: '变换', hot: true }
    ]},
  { title: '🎯 高级特性', items: [
      { id: 'variables', label: 'CSS 变量', hot: true },
      { id: 'pseudo-classes', label: '伪类', hot: true },
      { id: 'pseudo-elements', label: '伪元素', hot: true },
      { id: 'functions', label: 'CSS 函数', hot: true }
    ]}
])

const selectedId = ref('css-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== 页面样式内容映射表 ==========
const contentMap = {
  'css-intro': {
    title: 'CSS 简介',
    body: '<p class="lead">CSS（层叠样式表）用于描述 HTML 文档的呈现方式，控制网页的布局、颜色、字体等视觉效果。</p><h3>引入方式</h3><ul><li><strong>外部样式表</strong>：&lt;link rel="stylesheet" href="style.css"&gt;</li><li><strong>内部样式表</strong>：&lt;style&gt;...&lt;/style&gt;</li><li><strong>行内样式</strong>：style="color: red;"</li></ul><div class="note">💡 CSS 是网页三要素之一，与 HTML 和 JavaScript 共同构建现代网页。</div>',
    tags: ['CSS', '样式表', '基础']
  },
  selectors: {
    title: '选择器',
    body: '<p class="lead">选择器用于选择要应用样式的 HTML 元素。</p><pre><code>/* 元素选择器 */\np { color: red; }\n\n/* 类选择器 */\n.highlight { background: yellow; }\n\n/* ID 选择器 */\n#header { font-size: 24px; }\n\n/* 属性选择器 */\ninput[type="text"] { border: 1px solid #ccc; }\n\n/* 后代选择器 */\n.container p { margin: 10px; }\n\n/* 子选择器 */\n.parent > .child { padding: 5px; }\n\n/* 兄弟选择器 */\nh1 + p { margin-top: 0; }</code></pre>',
    tags: ['选择器', 'CSS规则', '匹配']
  },
  'box-model': {
    title: '盒模型',
    body: '<p class="lead">每个元素都是一个矩形盒子，由内容、内边距、边框、外边距组成。</p><pre><code>/* 标准盒模型 */\n.box {\n  width: 200px;\n  padding: 20px;\n  border: 1px solid #000;\n  margin: 10px;\n  box-sizing: content-box;\n}\n\n/* IE 盒模型（推荐） */\n.box {\n  box-sizing: border-box;\n}</code></pre><div class="note">🎯 推荐使用 border-box，宽度包含 padding 和 border。</div>',
    tags: ['盒模型', 'margin', 'padding']
  },
  units: {
    title: '单位与数值',
    body: '<p class="lead">CSS 支持多种单位，用于定义尺寸、间距等。</p><pre><code>/* 绝对单位 */\npx, pt, cm, mm, in\n\n/* 相对单位 */\nem, rem, vw, vh, vmin, vmax, %\n\n/* 使用示例 */\nhtml { font-size: 62.5%; }  /* 1rem = 10px */\n.container { width: 80vw; }\n.text { font-size: 1.6rem; }</code></pre>',
    tags: ['单位', 'px', 'rem']
  },
  colors: {
    title: '颜色与背景',
    body: '<p class="lead">控制元素的颜色和背景样式。</p><pre><code>/* 颜色值 */\ncolor: red;\ncolor: #ff0000;\ncolor: rgb(255, 0, 0);\ncolor: rgba(255, 0, 0, 0.5);\ncolor: hsl(0, 100%, 50%);\n\n/* 背景 */\nbackground-color: #f0f0f0;\nbackground-image: url("image.jpg");\nbackground-repeat: no-repeat;\nbackground-position: center;\nbackground-size: cover;</code></pre>',
    tags: ['颜色', '背景', 'RGB']
  },
  typography: {
    title: '字体与文本',
    body: '<p class="lead">控制文字的字体、大小、行高、对齐等样式。</p><pre><code>/* 字体 */\nfont-family: "Inter", system-ui, sans-serif;\nfont-size: 16px;\nfont-weight: bold;\nfont-style: italic;\n\n/* 文本 */\ntext-align: center;\ntext-decoration: underline;\ntext-transform: uppercase;\nline-height: 1.5;\nletter-spacing: 0.05em;\n\n/* 文本阴影 */\ntext-shadow: 2px 2px 4px rgba(0,0,0,0.3);</code></pre>',
    tags: ['字体', '文本', '排版']
  },
  borders: {
    title: '边框与圆角',
    body: '<p class="lead">控制元素的边框样式和圆角效果。</p><pre><code>/* 边框 */\nborder: 1px solid #ccc;\nborder-width: 2px;\nborder-style: dashed;\nborder-color: red;\n\n/* 圆角 */\nborder-radius: 8px;\nborder-radius: 50%;  /* 圆形 */\nborder-radius: 10px 20px 30px 40px;</code></pre>',
    tags: ['边框', '圆角', 'border']
  },
  shadows: {
    title: '阴影效果',
    body: '<p class="lead">为元素添加阴影，增强层次感。</p><pre><code>/* 盒子阴影 */\nbox-shadow: 0 4px 6px rgba(0,0,0,0.1);\nbox-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);\nbox-shadow: inset 0 2px 4px rgba(0,0,0,0.1);\n\n/* 多重阴影 */\nbox-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);\n\n/* 文本阴影 */\ntext-shadow: 1px 1px 2px rgba(0,0,0,0.3);</code></pre>',
    tags: ['阴影', 'box-shadow', 'text-shadow']
  },
  gradients: {
    title: '渐变效果',
    body: '<p class="lead">创建平滑的颜色渐变过渡。</p><pre><code>/* 线性渐变 */\nbackground: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\nbackground: linear-gradient(to right, red, blue);\n\n/* 径向渐变 */\nbackground: radial-gradient(circle at center, #ff9a9e, #fad0c4);\n\n/* 重复渐变 */\nbackground: repeating-linear-gradient(45deg, #f0f0f0 0px, #f0f0f0 20px, #e0e0e0 20px, #e0e0e0 40px);</code></pre>',
    tags: ['渐变', 'linear-gradient', 'radial-gradient']
  },
  display: {
    title: 'Display 显示',
    body: '<p class="lead">控制元素的显示类型。</p><pre><code>/* 块级元素 */\ndisplay: block;      /* 独占一行 */\n\n/* 内联元素 */\ndisplay: inline;     /* 不换行 */\n\n/* 内联块级 */\ndisplay: inline-block;  /* 不换行但可设置宽高 */\n\n/* 隐藏元素 */\ndisplay: none;       /* 完全隐藏，不占空间 */\nvisibility: hidden;  /* 隐藏但占空间 */\n\n/* Flex 布局 */\ndisplay: flex;\n\n/* Grid 布局 */\ndisplay: grid;</code></pre>',
    tags: ['display', '块级', '内联']
  },
  position: {
    title: '定位',
    body: '<p class="lead">控制元素的位置方式。</p><pre><code>/* 静态定位（默认） */\nposition: static;\n\n/* 相对定位 */\nposition: relative;\ntop: 10px;\nleft: 20px;\n\n/* 绝对定位 */\nposition: absolute;\ntop: 0;\nright: 0;\n\n/* 固定定位 */\nposition: fixed;\nbottom: 20px;\nright: 20px;\n\n/* 粘性定位 */\nposition: sticky;\ntop: 0;</code></pre>',
    tags: ['定位', 'absolute', 'relative']
  },
  flexbox: {
    title: 'Flex 弹性布局',
    body: '<p class="lead">Flex 是一维布局模型，适合处理行或列方向的布局。</p><pre><code>.container {\n  display: flex;\n  flex-direction: row;        /* 主轴方向 */\n  justify-content: center;    /* 主轴对齐 */\n  align-items: center;        /* 交叉轴对齐 */\n  flex-wrap: wrap;            /* 换行 */\n  gap: 16px;                  /* 间距 */\n}\n\n.item {\n  flex: 1;                    /* 占满剩余空间 */\n  order: 2;                   /* 排序 */\n  align-self: flex-end;       /* 单独对齐 */\n}</code></pre>',
    tags: ['Flex', '弹性布局', 'flexbox']
  },
  grid: {
    title: 'Grid 网格布局',
    body: '<p class="lead">Grid 是二维布局模型，适合复杂的网格布局。</p><pre><code>.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-template-rows: auto 200px auto;\n  gap: 20px;\n}\n\n.item {\n  grid-column: span 2;\n  grid-row: 1 / 3;\n}\n\n/* 响应式网格 */\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n}</code></pre>',
    tags: ['Grid', '网格', '二维布局']
  },
  float: {
    title: '浮动',
    body: '<p class="lead">浮动用于让元素向左或向右移动，常用于图文环绕。</p><pre><code>/* 浮动 */\n.float-left { float: left; }\n.float-right { float: right; }\n\n/* 清除浮动 */\n.clearfix::after {\n  content: "";\n  display: table;\n  clear: both;\n}</code></pre><div class="note">⚠️ 现代布局推荐使用 Flex 和 Grid，浮动主要用于文字环绕场景。</div>',
    tags: ['float', '清除浮动', 'clearfix']
  },
  'media-queries': {
    title: '媒体查询',
    body: '<p class="lead">根据设备特性（如屏幕宽度）应用不同的样式。</p><pre><code>/* 响应式断点 */\n@media (max-width: 768px) {\n  .container { width: 100%; }\n}\n\n@media (min-width: 768px) and (max-width: 1024px) {\n  .container { width: 750px; }\n}\n\n@media (min-width: 1024px) {\n  .container { width: 960px; }\n}\n\n/* 暗色模式 */\n@media (prefers-color-scheme: dark) {\n  body { background: #1a1a1a; color: #e0e0e0; }\n}\n\n/* 打印样式 */\n@media print {\n  .no-print { display: none; }\n}</code></pre>',
    tags: ['媒体查询', '响应式', '@media']
  },
  viewport: {
    title: '视口设置',
    body: '<p class="lead">视口 meta 标签控制移动端布局行为。</p><pre><code>&lt;meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"&gt;\n\n/* 视口单位 */\n.fullscreen {\n  width: 100vw;\n  height: 100vh;\n  min-height: 100dvh;  /* 动态视口高度 */\n}</code></pre>',
    tags: ['viewport', '视口', '移动端']
  },
  'responsive-units': {
    title: '响应式单位',
    body: '<p class="lead">使用相对单位实现响应式设计。</p><pre><code>/* 视口单位 */\nwidth: 50vw;      /* 视口宽度的 50% */\nheight: 30vh;     /* 视口高度的 30% */\nfont-size: 5vw;   /* 相对于视口宽度 */\n\n/* rem 单位 */\nhtml { font-size: 16px; }\n.text { font-size: 1.25rem; }  /* 20px */\n\n/* clamp() 函数 */\nfont-size: clamp(14px, 4vw, 24px);\nwidth: clamp(200px, 50%, 400px);</code></pre>',
    tags: ['响应式单位', 'vw', 'rem']
  },
  'mobile-first': {
    title: '移动优先',
    body: '<p class="lead">移动优先设计策略，先设计移动端，再通过媒体查询扩展到大屏幕。</p><pre><code>/* 移动端样式（基础） */\n.container { padding: 16px; }\n\n/* 平板 */\n@media (min-width: 768px) {\n  .container { padding: 24px; max-width: 720px; margin: 0 auto; }\n}\n\n/* 桌面 */\n@media (min-width: 1024px) {\n  .container { padding: 32px; max-width: 960px; }\n}</code></pre>',
    tags: ['移动优先', '响应式', '断点']
  },
  transitions: {
    title: '过渡效果',
    body: '<p class="lead">为属性变化添加平滑过渡效果。</p><pre><code>/* 基本过渡 */\n.button {\n  transition: all 0.3s ease;\n}\n.button:hover {\n  background: #8B5CF6;\n  transform: scale(1.05);\n}\n\n/* 指定属性 */\n.card {\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 10px 25px rgba(0,0,0,0.1);\n}\n\n/* 延迟 */\n.delayed {\n  transition-delay: 0.5s;\n}</code></pre>',
    tags: ['过渡', 'transition', '动画']
  },
  animations: {
    title: '关键帧动画',
    body: '<p class="lead">使用 @keyframes 定义复杂动画。</p><pre><code>@keyframes fadeIn {\n  from { opacity: 0; transform: translateY(20px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n.fade-in {\n  animation: fadeIn 0.5s ease-out;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n.spinner {\n  animation: spin 1s linear infinite;\n}\n\n/* 动画属性 */\n.element {\n  animation-name: slideIn;\n  animation-duration: 0.3s;\n  animation-timing-function: ease;\n  animation-delay: 0s;\n  animation-iteration-count: infinite;\n  animation-direction: alternate;\n}</code></pre>',
    tags: ['动画', '@keyframes', 'animation']
  },
  transforms: {
    title: '变换',
    body: '<p class="lead">对元素进行旋转、缩放、平移、倾斜等变换。</p><pre><code>/* 平移 */\n.transform-translate {\n  transform: translateX(20px);\n  transform: translateY(-10px);\n  transform: translate(20px, -10px);\n}\n\n/* 旋转 */\n.transform-rotate {\n  transform: rotate(45deg);\n}\n\n/* 缩放 */\n.transform-scale {\n  transform: scale(1.2);\n}\n\n/* 倾斜 */\n.transform-skew {\n  transform: skew(10deg, 5deg);\n}\n\n/* 组合变换 */\n.transform-combined {\n  transform: translate(50%, 50%) rotate(45deg) scale(1.5);\n}\n\n/* 3D 变换 */\n.transform-3d {\n  transform: rotateX(45deg) rotateY(30deg);\n  perspective: 500px;\n}</code></pre>',
    tags: ['变换', 'transform', '旋转']
  },
  variables: {
    title: 'CSS 变量',
    body: '<p class="lead">CSS 变量（自定义属性）用于存储可重用的值。</p><pre><code>/* 定义变量 */\n:root {\n  --primary-color: #8B5CF6;\n  --spacing: 16px;\n  --border-radius: 8px;\n}\n\n/* 使用变量 */\n.button {\n  background: var(--primary-color);\n  padding: var(--spacing);\n  border-radius: var(--border-radius);\n}\n\n/* 备用值 */\n.element {\n  color: var(--text-color, #333);\n}\n\n/* 动态修改 */\n.dark {\n  --primary-color: #a78bfa;\n}</code></pre>',
    tags: ['CSS变量', '自定义属性', 'var()']
  },
  'pseudo-classes': {
    title: '伪类',
    body: '<p class="lead">伪类根据元素状态选择元素。</p><pre><code>/* 链接状态 */\na:link, a:visited, a:hover, a:active\n\n/* 表单状态 */\ninput:focus, input:checked, input:disabled\n\n/* 位置选择 */\nli:first-child, li:last-child\nli:nth-child(odd), li:nth-child(3n)\n\n/* 否定伪类 */\ninput:not([type="submit"])\n\n/* 空元素 */\ndiv:empty { display: none; }\n\n/* 目标元素 */\n:target { background: yellow; }</code></pre>',
    tags: ['伪类', '状态', '选择器']
  },
  'pseudo-elements': {
    title: '伪元素',
    body: '<p class="lead">伪元素用于创建虚拟元素。</p><pre><code>/* 首字母 */\np::first-letter { font-size: 2em; }\n\n/* 首行 */\np::first-line { font-weight: bold; }\n\n/* 前置内容 */\n.quote::before {\n  content: "“";\n  font-size: 2em;\n  color: #ccc;\n}\n\n/* 后置内容 */\n.quote::after {\n  content: "”";\n  font-size: 2em;\n  color: #ccc;\n}\n\n/* 选择文本 */\n::selection {\n  background: #8B5CF6;\n  color: white;\n}\n\n/* 占位符 */\ninput::placeholder {\n  color: #999;\n}</code></pre>',
    tags: ['伪元素', '::before', '::after']
  },
  functions: {
    title: 'CSS 函数',
    body: '<p class="lead">CSS 提供了多种函数用于动态计算值。</p><pre><code>/* calc() 计算 */\nwidth: calc(100% - 40px);\nheight: calc(50vh - 20px);\n\n/* min() / max() */\nwidth: min(100%, 800px);\nfont-size: max(14px, 2vw);\n\n/* clamp() 限制 */\nfont-size: clamp(14px, 4vw, 24px);\n\n/* var() 变量 */\ncolor: var(--primary-color);\n\n/* url() 资源 */\nbackground: url("image.jpg");\n\n/* rgb() / rgba() */\ncolor: rgb(139, 92, 246);\ncolor: rgba(139, 92, 246, 0.5);\n\n/* hsl() / hsla() */\ncolor: hsl(260, 89%, 65%);</code></pre>',
    tags: ['CSS函数', 'calc', 'clamp']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 CSS 规范获取更多信息。</p>',
        tags: ['CSS', '样式']
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

addLink('css-intro', 'selectors')
addLink('selectors', 'box-model')
addLink('box-model', 'units')
addLink('colors', 'typography')
addLink('typography', 'borders')
addLink('borders', 'shadows')
addLink('shadows', 'gradients')
addLink('display', 'position')
addLink('position', 'flexbox')
addLink('flexbox', 'grid')
addLink('grid', 'float')
addLink('media-queries', 'viewport')
addLink('viewport', 'responsive-units')
addLink('responsive-units', 'mobile-first')
addLink('transitions', 'animations')
addLink('animations', 'transforms')
addLink('variables', 'pseudo-classes')
addLink('pseudo-classes', 'pseudo-elements')
addLink('pseudo-elements', 'functions')

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