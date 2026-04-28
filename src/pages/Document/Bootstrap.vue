<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Bootstrap 知识库</h1>
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
          <h2>📱 <span class="gradient-text">Bootstrap 完全指南</span></h2>
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
          <p>📱 最流行的前端框架 | 响应式 Web 开发</p>
          <p>✨ 点击节点双向联动 | 快速构建现代网站</p>
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
          <h3>🔗 Bootstrap 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Bootstrap用户'
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

// ========== Bootstrap 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'bs-intro', label: 'Bootstrap 简介', hot: true },
      { id: 'bs-install', label: '安装与引入', hot: true },
      { id: 'bs-grid', label: '网格系统', hot: true },
      { id: 'bs-breakpoints', label: '响应式断点', hot: true }
    ]},
  { title: '🎨 布局与内容', items: [
      { id: 'bs-container', label: '容器', hot: true },
      { id: 'bs-typography', label: '排版', hot: true },
      { id: 'bs-images', label: '图像与图标', hot: true },
      { id: 'bs-tables', label: '表格', hot: true },
      { id: 'bs-figures', label: '图文框' }
    ]},
  { title: '🔧 组件库', items: [
      { id: 'bs-buttons', label: '按钮', hot: true },
      { id: 'bs-cards', label: '卡片', hot: true },
      { id: 'bs-navbar', label: '导航栏', hot: true },
      { id: 'bs-modal', label: '模态框', hot: true },
      { id: 'bs-dropdown', label: '下拉菜单', hot: true },
      { id: 'bs-forms', label: '表单', hot: true },
      { id: 'bs-alerts', label: '警告框', hot: true }
    ]},
  { title: '⚙️ 工具类', items: [
      { id: 'bs-spacing', label: '间距', hot: true },
      { id: 'bs-colors', label: '颜色', hot: true },
      { id: 'bs-display', label: '显示与可见性', hot: true },
      { id: 'bs-flex', label: 'Flex 布局', hot: true },
      { id: 'bs-border', label: '边框与圆角', hot: true },
      { id: 'bs-shadow', label: '阴影', hot: true }
    ]},
  { title: '🔄 JavaScript 插件', items: [
      { id: 'bs-tooltip', label: '工具提示', hot: true },
      { id: 'bs-popover', label: '弹出框', hot: true },
      { id: 'bs-carousel', label: '轮播图', hot: true },
      { id: 'bs-collapse', label: '折叠面板', hot: true },
      { id: 'bs-tabs', label: '标签页', hot: true }
    ]},
  { title: '🎯 自定义与主题', items: [
      { id: 'bs-customize', label: '自定义主题', hot: true },
      { id: 'bs-variables', label: 'CSS 变量', hot: true },
      { id: 'bs-icons', label: 'Bootstrap Icons', hot: true }
    ]}
])

const selectedId = ref('bs-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Bootstrap 内容映射表 ==========
const contentMap = {
  'bs-intro': {
    title: 'Bootstrap 简介',
    body: '<p class="lead">Bootstrap 是最流行的前端框架之一，用于快速开发响应式、移动优先的网站和应用。</p><h3>核心特点</h3><ul><li><strong>移动优先</strong>：移动设备优先的设计理念</li><li><strong>响应式网格</strong>：12 列响应式网格系统</li><li><strong>丰富的组件</strong>：导航栏、模态框、卡片等</li><li><strong>JavaScript 插件</strong>：内置交互组件</li><li><strong>可定制</strong>：通过 CSS 变量和 SASS 轻松定制</li></ul><div class="note">💡 Bootstrap 最初由 Twitter 团队开发，是目前 GitHub 上最受欢迎的前端框架之一。</div>',
    tags: ['前端框架', '响应式', '移动优先']
  },
  'bs-install': {
    title: '安装与引入',
    body: '<p class="lead">Bootstrap 可以通过多种方式安装和使用。</p><pre><code>// CDN 引入（最简单）\n&lt;link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"&gt;\n&lt;script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"&gt;&lt;/script&gt;\n\n// npm 安装\nnpm install bootstrap@5.3.0\n\n// 在 SCSS 中引入\n@import "bootstrap/scss/bootstrap";\n\n// 在 JS 中引入\nimport "bootstrap/dist/js/bootstrap.bundle.min.js"\n\n// 使用 Vite/Webpack 等构建工具\nimport "bootstrap/dist/css/bootstrap.min.css"</code></pre>',
    tags: ['安装', 'CDN', 'npm']
  },
  'bs-grid': {
    title: '网格系统',
    body: '<p class="lead">Bootstrap 使用 12 列网格系统，支持响应式布局。</p><pre><code>&lt;div class="container"&gt;\n  &lt;div class="row"&gt;\n    &lt;div class="col"&gt;列1&lt;/div&gt;\n    &lt;div class="col"&gt;列2&lt;/div&gt;\n    &lt;div class="col"&gt;列3&lt;/div&gt;\n  &lt;/div&gt;\n&lt;/div&gt;\n\n&lt;div class="row"&gt;\n  &lt;div class="col-4"&gt;占4列&lt;/div&gt;\n  &lt;div class="col-8"&gt;占8列&lt;/div&gt;\n&lt;/div&gt;\n\n&lt;div class="row"&gt;\n  &lt;div class="col-12 col-md-6 col-lg-4"&gt;响应式列&lt;/div&gt;\n&lt;/div&gt;\n\n&lt;div class="col-4 offset-4"&gt;居中列&lt;/div&gt;</code></pre>',
    tags: ['网格', '响应式', '布局']
  },
  'bs-breakpoints': {
    title: '响应式断点',
    body: '<p class="lead">Bootstrap 提供了 6 个响应式断点。</p><pre><code>// 断点值\n// xs: 0px, sm: 576px, md: 768px\n// lg: 992px, xl: 1200px, xxl: 1400px\n\n&lt;div class="col-12 col-sm-6 col-md-4 col-lg-3"&gt;响应式列宽&lt;/div&gt;\n\n&lt;div class="d-none d-md-block"&gt;移动端隐藏，平板上显示&lt;/div&gt;\n&lt;div class="d-md-none"&gt;只在移动端显示&lt;/div&gt;</code></pre>',
    tags: ['断点', '响应式', 'breakpoints']
  },
  'bs-container': {
    title: '容器',
    body: '<p class="lead">容器是 Bootstrap 布局的基础组件。</p><pre><code>&lt;div class="container"&gt;固定宽度容器&lt;/div&gt;\n&lt;div class="container-fluid"&gt;100%宽度容器&lt;/div&gt;\n&lt;div class="container-sm"&gt;响应式容器&lt;/div&gt;</code></pre>',
    tags: ['容器', 'container', '布局']
  },
  'bs-typography': {
    title: '排版',
    body: '<p class="lead">Bootstrap 提供丰富的排版样式。</p><pre><code>&lt;h1&gt;h1 标题&lt;/h1&gt;\n&lt;h2&gt;h2 标题&lt;/h2&gt;\n&lt;div class="h1"&gt;类名方式&lt;/div&gt;\n&lt;h1 class="display-1"&gt;Display 1&lt;/h1&gt;\n&lt;p class="text-start"&gt;左对齐&lt;/p&gt;\n&lt;p class="text-center"&gt;居中&lt;/p&gt;\n&lt;p class="text-end"&gt;右对齐&lt;/p&gt;\n&lt;p class="text-primary"&gt;主要颜色&lt;/p&gt;\n&lt;p class="text-muted"&gt;柔和颜色&lt;/p&gt;</code></pre>',
    tags: ['排版', '文本', '标题']
  },
  'bs-images': {
    title: '图像与图标',
    body: '<p class="lead">Bootstrap 提供图像样式和图标库。</p><pre><code>&lt;img src="..." class="img-fluid" alt="响应式图片"&gt;\n&lt;img src="..." class="rounded" alt="圆角"&gt;\n&lt;img src="..." class="rounded-circle" alt="圆形"&gt;\n&lt;i class="bi bi-heart"&gt;&lt;/i&gt;\n&lt;i class="bi bi-star-fill"&gt;&lt;/i&gt;</code></pre>',
    tags: ['图片', '图标', '图像']
  },
  'bs-tables': {
    title: '表格',
    body: '<p class="lead">Bootstrap 提供丰富的表格样式。</p><pre><code>&lt;table class="table"&gt;\n  &lt;thead&gt;\n    <tr>&lt;th&gt;姓名&lt;/th&gt;&lt;th&gt;年龄&lt;/th&gt; </tr>\n  &lt;/thead&gt;\n  &lt;tbody&gt;\n    <tr>&lt;td&gt;Alice&lt;/td&gt;&lt;td&gt;25&lt;/td&gt; </tr>\n  &lt;/tbody&gt;\n&lt;/table&gt;\n\n&lt;table class="table table-striped"&gt;斑马纹表格&lt;/table&gt;\n&lt;table class="table table-bordered"&gt;带边框表格&lt;/table&gt;\n&lt;table class="table table-hover"&gt;悬停表格&lt;/table&gt;</code></pre>',
    tags: ['表格', 'table', '数据展示']
  },
  'bs-figures': {
    title: '图文框',
    body: '<p class="lead">图文框用于展示图片和说明文字。</p><pre><code>&lt;figure class="figure"&gt;\n  &lt;img src="..." class="figure-img img-fluid rounded" alt="..."&gt;\n  &lt;figcaption class="figure-caption"&gt;图片说明文字&lt;/figcaption&gt;\n&lt;/figure&gt;</code></pre>',
    tags: ['图文框', 'figure', '图片说明']
  },
  'bs-buttons': {
    title: '按钮',
    body: '<p class="lead">Bootstrap 提供多种按钮样式和状态。</p><pre><code>&lt;button class="btn btn-primary"&gt;主要&lt;/button&gt;\n&lt;button class="btn btn-secondary"&gt;次要&lt;/button&gt;\n&lt;button class="btn btn-success"&gt;成功&lt;/button&gt;\n&lt;button class="btn btn-danger"&gt;危险&lt;/button&gt;\n&lt;button class="btn btn-warning"&gt;警告&lt;/button&gt;\n&lt;button class="btn btn-info"&gt;信息&lt;/button&gt;\n&lt;button class="btn btn-outline-primary"&gt;轮廓按钮&lt;/button&gt;\n&lt;button class="btn btn-primary btn-lg"&gt;大按钮&lt;/button&gt;\n&lt;button class="btn btn-primary btn-sm"&gt;小按钮&lt;/button&gt;</code></pre>',
    tags: ['按钮', 'button', '样式']
  },
  'bs-cards': {
    title: '卡片',
    body: '<p class="lead">卡片是 Bootstrap 中最通用的组件之一。</p><pre><code>&lt;div class="card" style="width: 18rem;"&gt;\n  &lt;img src="..." class="card-img-top" alt="..."&gt;\n  &lt;div class="card-body"&gt;\n    &lt;h5 class="card-title"&gt;卡片标题&lt;/h5&gt;\n    &lt;p class="card-text"&gt;卡片内容描述文字。&lt;/p&gt;\n    &lt;a href="#" class="btn btn-primary"&gt;按钮&lt;/a&gt;\n  &lt;/div&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['卡片', 'card', '容器']
  },
  'bs-navbar': {
    title: '导航栏',
    body: '<p class="lead">响应式导航栏，支持品牌、链接、下拉菜单等。</p><pre><code>&lt;nav class="navbar navbar-expand-lg bg-body-tertiary"&gt;\n  &lt;div class="container-fluid"&gt;\n    &lt;a class="navbar-brand" href="#"&gt;品牌&lt;/a&gt;\n    &lt;button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"&gt;\n      &lt;span class="navbar-toggler-icon"&gt;&lt;/span&gt;\n    &lt;/button&gt;\n    &lt;div class="collapse navbar-collapse" id="navbarNav"&gt;\n      &lt;ul class="navbar-nav"&gt;\n        &lt;li class="nav-item"&gt;\n          &lt;a class="nav-link active" href="#"&gt;首页&lt;/a&gt;\n        &lt;/li&gt;\n      &lt;/ul&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/nav&gt;</code></pre>',
    tags: ['导航栏', 'navbar', '响应式导航']
  },
  'bs-modal': {
    title: '模态框',
    body: '<p class="lead">模态框是弹出式对话框，需要 JavaScript 支持。</p><pre><code>&lt;button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal"&gt;打开模态框&lt;/button&gt;\n\n&lt;div class="modal fade" id="exampleModal" tabindex="-1"&gt;\n  &lt;div class="modal-dialog"&gt;\n    &lt;div class="modal-content"&gt;\n      &lt;div class="modal-header"&gt;\n        &lt;h1 class="modal-title"&gt;模态框标题&lt;/h1&gt;\n        &lt;button type="button" class="btn-close" data-bs-dismiss="modal"&gt;&lt;/button&gt;\n      &lt;/div&gt;\n      &lt;div class="modal-body"&gt;模态框内容&lt;/div&gt;\n      &lt;div class="modal-footer"&gt;\n        &lt;button type="button" class="btn btn-secondary" data-bs-dismiss="modal"&gt;关闭&lt;/button&gt;\n        &lt;button type="button" class="btn btn-primary"&gt;保存&lt;/button&gt;\n      &lt;/div&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['模态框', 'modal', '弹窗']
  },
  'bs-dropdown': {
    title: '下拉菜单',
    body: '<p class="lead">下拉菜单用于显示可选项列表。</p><pre><code>&lt;div class="dropdown"&gt;\n  &lt;button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown"&gt;下拉菜单&lt;/button&gt;\n  &lt;ul class="dropdown-menu"&gt;\n    &lt;li&gt;&lt;a class="dropdown-item" href="#"&gt;选项1&lt;/a&gt;&lt;/li&gt;\n    &lt;li&gt;&lt;a class="dropdown-item" href="#"&gt;选项2&lt;/a&gt;&lt;/li&gt;\n    &lt;li&gt;&lt;hr class="dropdown-divider"&gt;&lt;/li&gt;\n    &lt;li&gt;&lt;a class="dropdown-item" href="#"&gt;选项3&lt;/a&gt;&lt;/li&gt;\n  &lt;/ul&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['下拉菜单', 'dropdown', '菜单']
  },
  'bs-forms': {
    title: '表单',
    body: '<p class="lead">Bootstrap 提供完整的表单样式和布局。</p><pre><code>&lt;form&gt;\n  &lt;div class="mb-3"&gt;\n    &lt;label for="email" class="form-label"&gt;邮箱地址&lt;/label&gt;\n    &lt;input type="email" class="form-control" id="email" placeholder="name@example.com"&gt;\n  &lt;/div&gt;\n  &lt;div class="mb-3"&gt;\n    &lt;label for="password" class="form-label"&gt;密码&lt;/label&gt;\n    &lt;input type="password" class="form-control" id="password"&gt;\n  &lt;/div&gt;\n  &lt;button type="submit" class="btn btn-primary"&gt;提交&lt;/button&gt;\n&lt;/form&gt;</code></pre>',
    tags: ['表单', 'form', '输入']
  },
  'bs-alerts': {
    title: '警告框',
    body: '<p class="lead">警告框用于显示重要信息。</p><pre><code>&lt;div class="alert alert-primary" role="alert"&gt;主要警告框&lt;/div&gt;\n&lt;div class="alert alert-success" role="alert"&gt;成功警告框&lt;/div&gt;\n&lt;div class="alert alert-danger" role="alert"&gt;危险警告框&lt;/div&gt;\n&lt;div class="alert alert-warning alert-dismissible fade show" role="alert"&gt;\n  &lt;strong&gt;提示！&lt;/strong&gt; 这是一条消息。\n  &lt;button type="button" class="btn-close" data-bs-dismiss="alert"&gt;&lt;/button&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['警告框', 'alert', '消息']
  },
  'bs-spacing': {
    title: '间距',
    body: '<p class="lead">Bootstrap 提供间距工具类。</p><pre><code>&lt;div class="p-3"&gt;中等内边距&lt;/div&gt;\n&lt;div class="p-5"&gt;大内边距&lt;/div&gt;\n&lt;div class="pt-3"&gt;上内边距&lt;/div&gt;\n&lt;div class="pb-3"&gt;下内边距&lt;/div&gt;\n&lt;div class="px-3"&gt;水平内边距&lt;/div&gt;\n&lt;div class="py-3"&gt;垂直内边距&lt;/div&gt;\n&lt;div class="mt-3"&gt;上外边距&lt;/div&gt;\n&lt;div class="mb-3"&gt;下外边距&lt;/div&gt;\n&lt;div class="mx-auto"&gt;水平居中&lt;/div&gt;</code></pre>',
    tags: ['间距', 'margin', 'padding']
  },
  'bs-colors': {
    title: '颜色',
    body: '<p class="lead">Bootstrap 提供文本和背景颜色工具类。</p><pre><code>&lt;p class="text-primary"&gt;主要文字&lt;/p&gt;\n&lt;p class="text-success"&gt;成功文字&lt;/p&gt;\n&lt;p class="text-danger"&gt;危险文字&lt;/p&gt;\n&lt;p class="text-muted"&gt;柔和文字&lt;/p&gt;\n&lt;div class="bg-primary"&gt;主要背景&lt;/div&gt;\n&lt;div class="bg-success"&gt;成功背景&lt;/div&gt;</code></pre>',
    tags: ['颜色', 'text', 'bg']
  },
  'bs-display': {
    title: '显示与可见性',
    body: '<p class="lead">控制元素的显示和隐藏。</p><pre><code>&lt;div class="d-none"&gt;隐藏&lt;/div&gt;\n&lt;div class="d-block"&gt;块级显示&lt;/div&gt;\n&lt;div class="d-inline"&gt;内联显示&lt;/div&gt;\n&lt;div class="d-flex"&gt;弹性显示&lt;/div&gt;\n&lt;div class="d-none d-md-block"&gt;移动端隐藏，平板上显示&lt;/div&gt;\n&lt;div class="d-md-none"&gt;只在移动端显示&lt;/div&gt;</code></pre>',
    tags: ['显示', '可见性', 'display']
  },
  'bs-flex': {
    title: 'Flex 布局',
    body: '<p class="lead">Bootstrap 提供完整的 Flexbox 工具类。</p><pre><code>&lt;div class="d-flex"&gt;弹性容器&lt;/div&gt;\n&lt;div class="flex-row"&gt;水平方向&lt;/div&gt;\n&lt;div class="flex-column"&gt;垂直方向&lt;/div&gt;\n&lt;div class="justify-content-start"&gt;左对齐&lt;/div&gt;\n&lt;div class="justify-content-center"&gt;居中&lt;/div&gt;\n&lt;div class="justify-content-between"&gt;两端对齐&lt;/div&gt;\n&lt;div class="align-items-start"&gt;顶部对齐&lt;/div&gt;\n&lt;div class="align-items-center"&gt;居中&lt;/div&gt;</code></pre>',
    tags: ['Flex', '弹性布局', 'd-flex']
  },
  'bs-border': {
    title: '边框与圆角',
    body: '<p class="lead">边框和圆角工具类。</p><pre><code>&lt;div class="border"&gt;边框&lt;/div&gt;\n&lt;div class="border-0"&gt;无边框&lt;/div&gt;\n&lt;div class="border-top"&gt;上边框&lt;/div&gt;\n&lt;div class="border-bottom"&gt;下边框&lt;/div&gt;\n&lt;div class="border border-primary"&gt;主要边框&lt;/div&gt;\n&lt;div class="rounded"&gt;圆角&lt;/div&gt;\n&lt;div class="rounded-circle"&gt;圆形&lt;/div&gt;\n&lt;div class="rounded-pill"&gt;药丸形状&lt;/div&gt;</code></pre>',
    tags: ['边框', '圆角', 'border']
  },
  'bs-shadow': {
    title: '阴影',
    body: '<p class="lead">阴影工具类。</p><pre><code>&lt;div class="shadow-none"&gt;无阴影&lt;/div&gt;\n&lt;div class="shadow-sm"&gt;小阴影&lt;/div&gt;\n&lt;div class="shadow"&gt;中等阴影&lt;/div&gt;\n&lt;div class="shadow-lg"&gt;大阴影&lt;/div&gt;</code></pre>',
    tags: ['阴影', 'shadow', 'box-shadow']
  },
  'bs-tooltip': {
    title: '工具提示',
    body: '<p class="lead">工具提示提供额外的信息提示。</p><pre><code>&lt;button type="button" class="btn btn-secondary" data-bs-toggle="tooltip" data-bs-placement="top" title="工具提示文本"&gt;悬停显示提示&lt;/button&gt;\n&lt;button data-bs-placement="top"&gt;上方&lt;/button&gt;\n&lt;button data-bs-placement="bottom"&gt;下方&lt;/button&gt;</code></pre>',
    tags: ['工具提示', 'tooltip', '提示']
  },
  'bs-popover': {
    title: '弹出框',
    body: '<p class="lead">弹出框比工具提示更丰富，可以包含标题和内容。</p><pre><code>&lt;button type="button" class="btn btn-lg btn-danger" data-bs-toggle="popover" data-bs-title="弹出框标题" data-bs-content="弹出框内容"&gt;点击显示弹出框&lt;/button&gt;</code></pre>',
    tags: ['弹出框', 'popover', '提示框']
  },
  'bs-carousel': {
    title: '轮播图',
    body: '<p class="lead">轮播图用于循环展示图片或内容。</p><pre><code>&lt;div id="demo" class="carousel slide" data-bs-ride="carousel"&gt;\n  &lt;div class="carousel-inner"&gt;\n    &lt;div class="carousel-item active"&gt;\n      &lt;img src="slide1.jpg" class="d-block w-100" alt="..."&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;\n  &lt;button class="carousel-control-prev" type="button" data-bs-target="#demo" data-bs-slide="prev"&gt;\n    &lt;span class="carousel-control-prev-icon"&gt;&lt;/span&gt;\n  &lt;/button&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['轮播图', 'carousel', '幻灯片']
  },
  'bs-collapse': {
    title: '折叠面板',
    body: '<p class="lead">折叠面板用于隐藏/显示内容。</p><pre><code>&lt;button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample"&gt;点击展开/折叠&lt;/button&gt;\n&lt;div class="collapse" id="collapseExample"&gt;\n  &lt;div class="card card-body"&gt;折叠面板的内容&lt;/div&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['折叠', 'collapse', '手风琴']
  },
  'bs-tabs': {
    title: '标签页',
    body: '<p class="lead">标签页用于切换不同内容。</p><pre><code>&lt;ul class="nav nav-tabs" id="myTab" role="tablist"&gt;\n  &lt;li class="nav-item"&gt;\n    &lt;button class="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home"&gt;首页&lt;/button&gt;\n  &lt;/li&gt;\n  &lt;li class="nav-item"&gt;\n    &lt;button class="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile"&gt;个人资料&lt;/button&gt;\n  &lt;/li&gt;\n&lt;/ul&gt;\n&lt;div class="tab-content"&gt;\n  &lt;div class="tab-pane fade show active" id="home"&gt;首页内容&lt;/div&gt;\n  &lt;div class="tab-pane fade" id="profile"&gt;个人资料内容&lt;/div&gt;\n&lt;/div&gt;</code></pre>',
    tags: ['标签页', 'tabs', '导航']
  },
  'bs-customize': {
    title: '自定义主题',
    body: '<p class="lead">通过 SASS 变量自定义 Bootstrap 主题。</p><pre><code>// custom.scss\n$primary: #8B5CF6;\n$secondary: #6c757d;\n$success: #28a745;\n$font-family-sans-serif: "Inter", system-ui, sans-serif;\n$border-radius: 0.5rem;\n@import "bootstrap/scss/bootstrap";</code></pre>',
    tags: ['自定义', '主题', 'SASS']
  },
  'bs-variables': {
    title: 'CSS 变量',
    body: '<p class="lead">Bootstrap 5 使用 CSS 变量实现动态主题。</p><pre><code>&lt;div style="--bs-primary: #8B5CF6;"&gt;\n  &lt;button class="btn btn-primary"&gt;自定义主色按钮&lt;/button&gt;\n&lt;/div&gt;\n&lt;style&gt;\n  :root { --bs-primary-rgb: 139, 92, 246; }\n&lt;/style&gt;</code></pre>',
    tags: ['CSS变量', '主题', '动态样式']
  },
  'bs-icons': {
    title: 'Bootstrap Icons',
    body: '<p class="lead">Bootstrap Icons 是开源 SVG 图标库。</p><pre><code>&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"&gt;\n&lt;i class="bi bi-alarm"&gt;&lt;/i&gt;\n&lt;i class="bi bi-heart-fill text-danger"&gt;&lt;/i&gt;\n&lt;i class="bi bi-star-half"&gt;&lt;/i&gt;\n&lt;i class="bi bi-house-door"&gt; 首页&lt;/i&gt;\n&lt;i class="bi bi-search"&gt; 搜索&lt;/i&gt;</code></pre>',
    tags: ['图标', 'icons', 'Bootstrap Icons']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Bootstrap 官方文档获取更多信息。</p>',
        tags: ['Bootstrap', 'CSS框架']
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

addLink('bs-intro', 'bs-install')
addLink('bs-install', 'bs-grid')
addLink('bs-grid', 'bs-breakpoints')
addLink('bs-container', 'bs-grid')
addLink('bs-typography', 'bs-images')
addLink('bs-images', 'bs-tables')
addLink('bs-buttons', 'bs-cards')
addLink('bs-cards', 'bs-navbar')
addLink('bs-navbar', 'bs-modal')
addLink('bs-modal', 'bs-dropdown')
addLink('bs-dropdown', 'bs-forms')
addLink('bs-forms', 'bs-alerts')
addLink('bs-spacing', 'bs-colors')
addLink('bs-colors', 'bs-display')
addLink('bs-display', 'bs-flex')
addLink('bs-flex', 'bs-border')
addLink('bs-border', 'bs-shadow')
addLink('bs-tooltip', 'bs-popover')
addLink('bs-popover', 'bs-carousel')
addLink('bs-carousel', 'bs-collapse')
addLink('bs-collapse', 'bs-tabs')
addLink('bs-customize', 'bs-variables')
addLink('bs-variables', 'bs-icons')

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