<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Element Plus 知识库</h1>
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
          <h2>🍀 <span class="gradient-text">Element Plus 完全指南</span></h2>
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
          <p>🍀 基于 Vue 3 的桌面端组件库</p>
          <p>✨ 点击节点双向联动 | 开箱即用</p>
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
          <h3>🔗 Element Plus 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Element用户'
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

// ========== Element Plus 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'ep-intro', label: 'Element Plus 简介', hot: true },
      { id: 'ep-install', label: '安装与配置', hot: true },
      { id: 'ep-import', label: '按需导入', hot: true },
      { id: 'ep-theme', label: '主题定制', hot: true }
    ]},
  { title: '🎨 基础组件', items: [
      { id: 'ep-button', label: 'Button 按钮', hot: true },
      { id: 'ep-icon', label: 'Icon 图标', hot: true },
      { id: 'ep-link', label: 'Link 文字链接', hot: true },
      { id: 'ep-typography', label: 'Typography 排版', hot: true }
    ]},
  { title: '📋 布局组件', items: [
      { id: 'ep-container', label: 'Container 布局容器', hot: true },
      { id: 'ep-row-col', label: 'Row/Col 栅格', hot: true },
      { id: 'ep-card', label: 'Card 卡片', hot: true },
      { id: 'ep-divider', label: 'Divider 分割线', hot: true },
      { id: 'ep-space', label: 'Space 间距', hot: true }
    ]},
  { title: '🔧 导航组件', items: [
      { id: 'ep-menu', label: 'Menu 菜单', hot: true },
      { id: 'ep-tabs', label: 'Tabs 标签页', hot: true },
      { id: 'ep-breadcrumb', label: 'Breadcrumb 面包屑', hot: true },
      { id: 'ep-pagination', label: 'Pagination 分页', hot: true },
      { id: 'ep-dropdown', label: 'Dropdown 下拉菜单', hot: true }
    ]},
  { title: '📊 数据展示', items: [
      { id: 'ep-table', label: 'Table 表格', hot: true },
      { id: 'ep-tag', label: 'Tag 标签', hot: true },
      { id: 'ep-badge', label: 'Badge 徽标', hot: true },
      { id: 'ep-avatar', label: 'Avatar 头像', hot: true },
      { id: 'ep-progress', label: 'Progress 进度条', hot: true },
      { id: 'ep-tree', label: 'Tree 树形控件', hot: true }
    ]},
  { title: '📝 数据录入', items: [
      { id: 'ep-form', label: 'Form 表单', hot: true },
      { id: 'ep-input', label: 'Input 输入框', hot: true },
      { id: 'ep-select', label: 'Select 选择器', hot: true },
      { id: 'ep-datepicker', label: 'DatePicker 日期选择', hot: true },
      { id: 'ep-upload', label: 'Upload 上传', hot: true },
      { id: 'ep-switch', label: 'Switch 开关', hot: true },
      { id: 'ep-checkbox', label: 'Checkbox 复选框', hot: true },
      { id: 'ep-radio', label: 'Radio 单选框', hot: true }
    ]},
  { title: '💬 反馈组件', items: [
      { id: 'ep-dialog', label: 'Dialog 对话框', hot: true },
      { id: 'ep-message', label: 'Message 消息提示', hot: true },
      { id: 'ep-notification', label: 'Notification 通知', hot: true },
      { id: 'ep-popconfirm', label: 'Popconfirm 气泡确认', hot: true },
      { id: 'ep-loading', label: 'Loading 加载', hot: true }
    ]}
])

const selectedId = ref('ep-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Element Plus 内容映射表 ==========
const contentMap = {
  'ep-intro': {
    title: 'Element Plus 简介',
    body: '<p class="lead">Element Plus 是基于 Vue 3 的桌面端组件库，由饿了么前端团队开发，是 Element UI 的 Vue 3 版本。</p><h3>核心特点</h3><ul><li><strong>Vue 3 原生</strong>：充分利用 Vue 3 的 Composition API</li><li><strong>TypeScript</strong>：完整的 TypeScript 支持</li><li><strong>主题定制</strong>：支持 CSS 变量和 SCSS 变量</li><li><strong>国际化</strong>：多语言支持</li><li><strong>按需加载</strong>：支持按需导入，减小打包体积</li></ul><div class="note">💡 Element Plus 是 Vue 3 生态中最流行的 UI 组件库之一。</div>',
    tags: ['Vue3', 'UI组件库', '桌面端']
  },
  'ep-install': {
    title: '安装与配置',
    body: '<p class="lead">Element Plus 可以通过 npm 或 yarn 安装。</p><pre><code>// npm 安装\nnpm install element-plus\n\n// yarn 安装\nyarn add element-plus\n\n// 完整引入\nimport { createApp } from "vue"\nimport ElementPlus from "element-plus"\nimport "element-plus/dist/index.css"\n\nconst app = createApp(App)\napp.use(ElementPlus)\n\n// 使用组件\n&lt;template&gt;\n  &lt;el-button type="primary"&gt;按钮&lt;/el-button&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['安装', 'npm', 'Vue3']
  },
  'ep-import': {
    title: '按需导入',
    body: '<p class="lead">按需导入可以减少打包体积。</p><pre><code>// 手动按需导入\nimport { ElButton, ElInput } from "element-plus"\nimport "element-plus/es/components/button/style/css"\nimport "element-plus/es/components/input/style/css"\n\n// 使用 unplugin-vue-components（推荐）\n// vite.config.js\nimport Components from "unplugin-vue-components/vite"\nimport { ElementPlusResolver } from "unplugin-vue-components/resolvers"\n\nexport default {\n  plugins: [\n    Components({\n      resolvers: [ElementPlusResolver()],\n    }),\n  ],\n}\n\n// 然后直接在模板中使用\n&lt;template&gt;\n  &lt;el-button&gt;按钮&lt;/el-button&gt;\n  &lt;el-input /&gt;\n&lt;/template&gt;</code></pre>',
    tags: ['按需导入', 'unplugin', '优化']
  },
  'ep-theme': {
    title: '主题定制',
    body: '<p class="lead">Element Plus 支持主题定制，可以修改 SCSS 变量或 CSS 变量。</p><pre><code>// 方式一：修改 SCSS 变量\n// 创建 element-variables.scss\n$--color-primary: #8B5CF6;\n\n// 在入口文件中引入\nimport "element-plus/theme-chalk/src/index.scss"\nimport "./element-variables.scss"\n\n// 方式二：CSS 变量覆盖\n.el-button--primary {\n  --el-button-bg-color: #8B5CF6;\n  --el-button-border-color: #8B5CF6;\n}\n\n// 方式三：使用 ConfigProvider 动态主题\n&lt;el-config-provider :locale="locale"&gt;\n  &lt;app /&gt;\n&lt;/el-config-provider&gt;</code></pre>',
    tags: ['主题定制', 'SCSS', 'CSS变量']
  },
  'ep-button': {
    title: 'Button 按钮',
    body: '<p class="lead">按钮用于开始一个即时操作。</p><pre><code>&lt;el-button&gt;默认按钮&lt;/el-button&gt;\n&lt;el-button type="primary"&gt;主要按钮&lt;/el-button&gt;\n&lt;el-button type="success"&gt;成功按钮&lt;/el-button&gt;\n&lt;el-button type="warning"&gt;警告按钮&lt;/el-button&gt;\n&lt;el-button type="danger"&gt;危险按钮&lt;/el-button&gt;\n&lt;el-button type="info"&gt;信息按钮&lt;/el-button&gt;\n\n&lt;!-- 按钮尺寸 --&gt;\n&lt;el-button size="large"&gt;大按钮&lt;/el-button&gt;\n&lt;el-button size="default"&gt;默认按钮&lt;/el-button&gt;\n&lt;el-button size="small"&gt;小按钮&lt;/el-button&gt;\n\n&lt;!-- 禁用状态 --&gt;\n&lt;el-button disabled&gt;禁用按钮&lt;/el-button&gt;\n&lt;el-button loading&gt;加载中&lt;/el-button&gt;\n\n&lt;!-- 文本按钮 --&gt;\n&lt;el-button text&gt;文本按钮&lt;/el-button&gt;\n&lt;el-button link&gt;链接按钮&lt;/el-button&gt;</code></pre>',
    tags: ['Button', '按钮', 'Element Plus']
  },
  'ep-icon': {
    title: 'Icon 图标',
    body: '<p class="lead">Element Plus 提供丰富的 SVG 图标。</p><pre><code>// 安装图标库\nnpm install @element-plus/icons-vue\n\n// 使用\nimport { Search, Edit, Delete } from "@element-plus/icons-vue"\n\n// 在组件中\n&lt;el-icon&gt;&lt;Search /&gt;&lt;/el-icon&gt;\n&lt;el-icon color="#409EFF" :size="20"&gt;&lt;Edit /&gt;&lt;/el-icon&gt;\n\n// 按钮中的图标\n&lt;el-button type="primary" :icon="Search"&gt;搜索&lt;/el-button&gt;\n\n// 自定义图标\n&lt;el-icon&gt;\n  &lt;svg viewBox="0 0 1024 1024"&gt;&lt;path d="..." /&gt;&lt;/svg&gt;\n&lt;/el-icon&gt;</code></pre>',
    tags: ['Icon', '图标', '@element-plus/icons-vue']
  },
  'ep-link': {
    title: 'Link 文字链接',
    body: '<p class="lead">文字链接用于页面跳转。</p><pre><code>&lt;el-link href="https://element-plus.org" target="_blank"&gt;默认链接&lt;/el-link&gt;\n&lt;el-link type="primary"&gt;主要链接&lt;/el-link&gt;\n&lt;el-link type="success"&gt;成功链接&lt;/el-link&gt;\n&lt;el-link type="warning"&gt;警告链接&lt;/el-link&gt;\n&lt;el-link type="danger"&gt;危险链接&lt;/el-link&gt;\n&lt;el-link type="info"&gt;信息链接&lt;/el-link&gt;\n\n&lt;!-- 下划线 --&gt;\n&lt;el-link :underline="false"&gt;无下划线&lt;/el-link&gt;\n\n&lt;!-- 禁用 --&gt;\n&lt;el-link disabled&gt;禁用链接&lt;/el-link&gt;\n\n&lt;!-- 图标 --&gt;\n&lt;el-link :icon="Edit"&gt;编辑&lt;/el-link&gt;</code></pre>',
    tags: ['Link', '链接', '导航']
  },
  'ep-typography': {
    title: 'Typography 排版',
    body: '<p class="lead">排版组件用于展示标题、段落等内容。</p><pre><code>&lt;!-- 标题 --&gt;\n&lt;el-typography&gt;\n  &lt;el-typography-title&gt;一级标题&lt;/el-typography-title&gt;\n  &lt;el-typography-title :level="2"&gt;二级标题&lt;/el-typography-title&gt;\n  &lt;el-typography-title :level="3"&gt;三级标题&lt;/el-typography-title&gt;\n&lt;/el-typography&gt;\n\n&lt;!-- 段落 --&gt;\n&lt;el-typography&gt;\n  &lt;el-typography-text&gt;普通文本&lt;/el-typography-text&gt;\n  &lt;el-typography-text type="primary"&gt;主要文本&lt;/el-typography-text&gt;\n  &lt;el-typography-text type="success"&gt;成功文本&lt;/el-typography-text&gt;\n  &lt;el-typography-text type="warning"&gt;警告文本&lt;/el-typography-text&gt;\n  &lt;el-typography-text type="danger"&gt;危险文本&lt;/el-typography-text&gt;\n  &lt;el-typography-text disabled&gt;禁用文本&lt;/el-typography-text&gt;\n&lt;/el-typography&gt;</code></pre>',
    tags: ['Typography', '排版', '文本']
  },
  'ep-container': {
    title: 'Container 布局容器',
    body: '<p class="lead">Container 组件用于搭建页面基本结构。</p><pre><code>&lt;el-container&gt;\n  &lt;el-header&gt;Header&lt;/el-header&gt;\n  &lt;el-container&gt;\n    &lt;el-aside width="200px"&gt;Aside&lt;/el-aside&gt;\n    &lt;el-main&gt;Main&lt;/el-main&gt;\n  &lt;/el-container&gt;\n  &lt;el-footer&gt;Footer&lt;/el-footer&gt;\n&lt;/el-container&gt;\n\n&lt;!-- 垂直布局 --&gt;\n&lt;el-container direction="vertical"&gt;\n  &lt;el-header&gt;Header&lt;/el-header&gt;\n  &lt;el-main&gt;Main&lt;/el-main&gt;\n  &lt;el-footer&gt;Footer&lt;/el-footer&gt;\n&lt;/el-container&gt;</code></pre>',
    tags: ['Container', '布局', 'Header/Footer']
  },
  'ep-row-col': {
    title: 'Row/Col 栅格',
    body: '<p class="lead">栅格系统用于布局，基于 24 列。</p><pre><code>&lt;el-row&gt;\n  &lt;el-col :span="12"&gt;col-12&lt;/el-col&gt;\n  &lt;el-col :span="12"&gt;col-12&lt;/el-col&gt;\n&lt;/el-row&gt;\n\n&lt;el-row :gutter="20"&gt;\n  &lt;el-col :span="8"&gt;col-8&lt;/el-col&gt;\n  &lt;el-col :span="8"&gt;col-8&lt;/el-col&gt;\n  &lt;el-col :span="8"&gt;col-8&lt;/el-col&gt;\n&lt;/el-row&gt;\n\n&lt;el-row justify="center" align="middle"&gt;\n  &lt;el-col :span="6"&gt;居中&lt;/el-col&gt;\n&lt;/el-row&gt;\n\n&lt;el-row&gt;\n  &lt;el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4"&gt;响应式列&lt;/el-col&gt;\n&lt;/el-row&gt;</code></pre>',
    tags: ['Row/Col', '栅格', '响应式']
  },
  'ep-card': {
    title: 'Card 卡片',
    body: '<p class="lead">卡片用于承载内容。</p><pre><code>&lt;el-card class="box-card"&gt;\n  &lt;template #header&gt;\n    &lt;div class="card-header"&gt;\n      &lt;span&gt;卡片标题&lt;/span&gt;\n      &lt;el-button type="text"&gt;操作按钮&lt;/el-button&gt;\n    &lt;/div&gt;\n  &lt;/template&gt;\n  &lt;div&gt;卡片内容&lt;/div&gt;\n&lt;/el-card&gt;\n\n&lt;!-- 简单卡片 --&gt;\n&lt;el-card shadow="always"&gt;总是显示阴影&lt;/el-card&gt;\n&lt;el-card shadow="hover"&gt;悬停显示阴影&lt;/el-card&gt;\n&lt;el-card shadow="never"&gt;从不显示阴影&lt;/el-card&gt;\n\n&lt;!-- 带图片卡片 --&gt;\n&lt;el-card :body-style="{ padding: "0px" }"&gt;\n  &lt;img src="image.jpg" class="image" /&gt;\n  &lt;div style="padding: 14px"&gt;卡片内容&lt;/div&gt;\n&lt;/el-card&gt;</code></pre>',
    tags: ['Card', '卡片', '容器']
  },
  'ep-divider': {
    title: 'Divider 分割线',
    body: '<p class="lead">分割线用于分隔内容。</p><pre><code>&lt;el-divider /&gt;\n\n&lt;el-divider content-position="left"&gt;左侧文字&lt;/el-divider&gt;\n&lt;el-divider content-position="center"&gt;居中文字&lt;/el-divider&gt;\n&lt;el-divider content-position="right"&gt;右侧文字&lt;/el-divider&gt;\n\n&lt;el-divider direction="vertical"&gt;&lt;/el-divider&gt;\n\n&lt;el-divider border-style="dashed"&gt;虚线分割线&lt;/el-divider&gt;</code></pre>',
    tags: ['Divider', '分割线', '分隔符']
  },
  'ep-space': {
    title: 'Space 间距',
    body: '<p class="lead">Space 用于设置组件之间的间距。</p><pre><code>&lt;el-space&gt;\n  &lt;el-button&gt;按钮1&lt;/el-button&gt;\n  &lt;el-button&gt;按钮2&lt;/el-button&gt;\n  &lt;el-button&gt;按钮3&lt;/el-button&gt;\n&lt;/el-space&gt;\n\n&lt;el-space size="large"&gt;\n  &lt;el-tag&gt;标签1&lt;/el-tag&gt;\n  &lt;el-tag&gt;标签2&lt;/el-tag&gt;\n&lt;/el-space&gt;\n\n&lt;el-space direction="vertical"&gt;\n  &lt;el-button&gt;垂直按钮1&lt;/el-button&gt;\n  &lt;el-button&gt;垂直按钮2&lt;/el-button&gt;\n&lt;/el-space&gt;\n\n&lt;el-space wrap&gt;\n  &lt;el-button&gt;自动换行1&lt;/el-button&gt;\n  &lt;el-button&gt;自动换行2&lt;/el-button&gt;\n&lt;/el-space&gt;</code></pre>',
    tags: ['Space', '间距', '布局']
  },
  'ep-menu': {
    title: 'Menu 菜单',
    body: '<p class="lead">Menu 用于页面导航。</p><pre><code>&lt;el-menu mode="horizontal"&gt;\n  &lt;el-menu-item index="1"&gt;首页&lt;/el-menu-item&gt;\n  &lt;el-menu-item index="2"&gt;关于&lt;/el-menu-item&gt;\n  &lt;el-menu-item index="3"&gt;联系&lt;/el-menu-item&gt;\n&lt;/el-menu&gt;\n\n&lt;el-menu mode="inline"&gt;\n  &lt;el-sub-menu index="1"&gt;\n    &lt;template #title&gt;导航一&lt;/template&gt;\n    &lt;el-menu-item index="1-1"&gt;选项1&lt;/el-menu-item&gt;\n    &lt;el-menu-item index="1-2"&gt;选项2&lt;/el-menu-item&gt;\n  &lt;/el-sub-menu&gt;\n&lt;/el-menu&gt;</code></pre>',
    tags: ['Menu', '菜单', '导航']
  },
  'ep-tabs': {
    title: 'Tabs 标签页',
    body: '<p class="lead">Tabs 用于切换不同视图。</p><pre><code>&lt;el-tabs&gt;\n  &lt;el-tab-pane label="标签1" name="first"&gt;内容1&lt;/el-tab-pane&gt;\n  &lt;el-tab-pane label="标签2" name="second"&gt;内容2&lt;/el-tab-pane&gt;\n  &lt;el-tab-pane label="标签3" name="third"&gt;内容3&lt;/el-tab-pane&gt;\n&lt;/el-tabs&gt;\n\n&lt;el-tabs type="card"&gt;\n  &lt;el-tab-pane label="卡片标签1"&gt;内容1&lt;/el-tab-pane&gt;\n  &lt;el-tab-pane label="卡片标签2"&gt;内容2&lt;/el-tab-pane&gt;\n&lt;/el-tabs&gt;\n\n&lt;el-tabs tab-position="left"&gt;\n  &lt;el-tab-pane label="左侧标签1"&gt;内容1&lt;/el-tab-pane&gt;\n&lt;/el-tabs&gt;</code></pre>',
    tags: ['Tabs', '标签页', 'TabPane']
  },
  'ep-breadcrumb': {
    title: 'Breadcrumb 面包屑',
    body: '<p class="lead">面包屑用于显示当前页面路径。</p><pre><code>&lt;el-breadcrumb separator="/"&gt;\n  &lt;el-breadcrumb-item :to="{ path: "/" }"&gt;首页&lt;/el-breadcrumb-item&gt;\n  &lt;el-breadcrumb-item&gt;用户管理&lt;/el-breadcrumb-item&gt;\n  &lt;el-breadcrumb-item&gt;用户列表&lt;/el-breadcrumb-item&gt;\n&lt;/el-breadcrumb&gt;\n\n&lt;el-breadcrumb separator="&gt;"&gt;\n  &lt;el-breadcrumb-item&gt;首页&lt;/el-breadcrumb-item&gt;\n  &lt;el-breadcrumb-item&gt;活动管理&lt;/el-breadcrumb-item&gt;\n&lt;/el-breadcrumb&gt;</code></pre>',
    tags: ['Breadcrumb', '面包屑', '导航']
  },
  'ep-pagination': {
    title: 'Pagination 分页',
    body: '<p class="lead">分页用于数据分页展示。</p><pre><code>&lt;el-pagination\n  v-model:current-page="currentPage"\n  v-model:page-size="pageSize"\n  :page-sizes="[10, 20, 50, 100]"\n  :total="total"\n  layout="total, sizes, prev, pager, next, jumper"\n/&gt;\n\n&lt;el-pagination\n  background\n  layout="prev, pager, next"\n  :total="1000"\n/&gt;\n\n&lt;el-pagination\n  small\n  layout="prev, pager, next"\n  :total="50"\n/&gt;</code></pre>',
    tags: ['Pagination', '分页', '翻页']
  },
  'ep-dropdown': {
    title: 'Dropdown 下拉菜单',
    body: '<p class="lead">Dropdown 用于触发下拉菜单。</p><pre><code>&lt;el-dropdown&gt;\n  &lt;el-button type="primary"&gt;下拉菜单&lt;el-icon class="el-icon--right"&gt;&lt;arrow-down /&gt;&lt;/el-icon&gt;&lt;/el-button&gt;\n  &lt;template #dropdown&gt;\n    &lt;el-dropdown-menu&gt;\n      &lt;el-dropdown-item&gt;选项1&lt;/el-dropdown-item&gt;\n      &lt;el-dropdown-item&gt;选项2&lt;/el-dropdown-item&gt;\n      &lt;el-dropdown-item divided&gt;选项3&lt;/el-dropdown-item&gt;\n    &lt;/el-dropdown-menu&gt;\n  &lt;/template&gt;\n&lt;/el-dropdown&gt;\n\n&lt;el-dropdown split-button type="primary"&gt;\n  主要按钮\n  &lt;template #dropdown&gt;...&lt;/template&gt;\n&lt;/el-dropdown&gt;</code></pre>',
    tags: ['Dropdown', '下拉菜单', '菜单']
  },
  'ep-table': {
    title: 'Table 表格',
    body: '<p class="lead">表格用于展示数据。</p><pre><code>&lt;el-table :data="tableData" style="width: 100%"&gt;\n  &lt;el-table-column prop="date" label="日期" width="180" /&gt;\n  &lt;el-table-column prop="name" label="姓名" width="180" /&gt;\n  &lt;el-table-column prop="address" label="地址" /&gt;\n  &lt;el-table-column label="操作"&gt;\n    &lt;template #default="scope"&gt;\n      &lt;el-button link type="primary" @click="handleEdit(scope.row)"&gt;编辑&lt;/el-button&gt;\n      &lt;el-button link type="danger" @click="handleDelete(scope.row)"&gt;删除&lt;/el-button&gt;\n    &lt;/template&gt;\n  &lt;/el-table-column&gt;\n&lt;/el-table&gt;\n\n&lt;el-table :data="tableData" stripe border /&gt;</code></pre>',
    tags: ['Table', '表格', '数据展示']
  },
  'ep-tag': {
    title: 'Tag 标签',
    body: '<p class="lead">标签用于标记和分类。</p><pre><code>&lt;el-tag&gt;标签&lt;/el-tag&gt;\n&lt;el-tag type="success"&gt;成功标签&lt;/el-tag&gt;\n&lt;el-tag type="warning"&gt;警告标签&lt;/el-tag&gt;\n&lt;el-tag type="danger"&gt;危险标签&lt;/el-tag&gt;\n&lt;el-tag type="info"&gt;信息标签&lt;/el-tag&gt;\n\n&lt;el-tag closable @close="handleClose"&gt;可关闭&lt;/el-tag&gt;\n&lt;el-tag size="large"&gt;大标签&lt;/el-tag&gt;\n&lt;el-tag size="small"&gt;小标签&lt;/el-tag&gt;\n&lt;el-tag effect="dark"&gt;深色标签&lt;/el-tag&gt;</code></pre>',
    tags: ['Tag', '标签', '标记']
  },
  'ep-badge': {
    title: 'Badge 徽标',
    body: '<p class="lead">徽标用于显示通知数量。</p><pre><code>&lt;el-badge :value="12" class="item"&gt;\n  &lt;el-button size="small"&gt;按钮&lt;/el-button&gt;\n&lt;/el-badge&gt;\n\n&lt;el-badge :value="200" :max="99" class="item"&gt;\n  &lt;el-button size="small"&gt;按钮&lt;/el-button&gt;\n&lt;/el-badge&gt;\n\n&lt;el-badge is-dot class="item"&gt;消息中心&lt;/el-badge&gt;\n\n&lt;el-badge value="new" class="item"&gt;新功能&lt;/el-badge&gt;</code></pre>',
    tags: ['Badge', '徽标', '通知']
  },
  'ep-avatar': {
    title: 'Avatar 头像',
    body: '<p class="lead">头像用于展示用户头像。</p><pre><code>&lt;el-avatar src="avatar.jpg" /&gt;\n&lt;el-avatar :size="50"&gt;U&lt;/el-avatar&gt;\n&lt;el-avatar :size="60" :icon="UserFilled" /&gt;\n\n&lt;el-avatar shape="square"&gt;A&lt;/el-avatar&gt;\n\n&lt;el-avatar-group :max="3"&gt;\n  &lt;el-avatar src="avatar1.jpg" /&gt;\n  &lt;el-avatar src="avatar2.jpg" /&gt;\n  &lt;el-avatar src="avatar3.jpg" /&gt;\n  &lt;el-avatar src="avatar4.jpg" /&gt;\n&lt;/el-avatar-group&gt;</code></pre>',
    tags: ['Avatar', '头像', '用户']
  },
  'ep-progress': {
    title: 'Progress 进度条',
    body: '<p class="lead">进度条用于展示进度。</p><pre><code>&lt;el-progress :percentage="50" /&gt;\n&lt;el-progress :percentage="60" status="success" /&gt;\n&lt;el-progress :percentage="70" status="warning" /&gt;\n&lt;el-progress :percentage="80" status="exception" /&gt;\n\n&lt;el-progress type="circle" :percentage="75" /&gt;\n&lt;el-progress type="dashboard" :percentage="75" /&gt;\n\n&lt;el-progress :percentage="100" :stroke-width="20" striped /&gt;</code></pre>',
    tags: ['Progress', '进度条', '百分比']
  },
  'ep-tree': {
    title: 'Tree 树形控件',
    body: '<p class="lead">树形控件用于展示层级数据。</p><pre><code>&lt;el-tree :data="treeData" :props="defaultProps" @node-click="handleNodeClick" /&gt;\n\n&lt;el-tree\n  :data="treeData"\n  show-checkbox\n  node-key="id"\n  default-expand-all\n  :expand-on-click-node="false"\n/&gt;\n\nconst defaultProps = {\n  children: "children",\n  label: "label",\n}</code></pre>',
    tags: ['Tree', '树形控件', '层级']
  },
  'ep-form': {
    title: 'Form 表单',
    body: '<p class="lead">表单用于数据收集和提交。</p><pre><code>&lt;el-form :model="form" :rules="rules" ref="formRef"&gt;\n  &lt;el-form-item label="用户名" prop="username"&gt;\n    &lt;el-input v-model="form.username" /&gt;\n  &lt;/el-form-item&gt;\n  &lt;el-form-item label="密码" prop="password"&gt;\n    &lt;el-input type="password" v-model="form.password" /&gt;\n  &lt;/el-form-item&gt;\n  &lt;el-form-item&gt;\n    &lt;el-button type="primary" @click="submitForm"&gt;提交&lt;/el-button&gt;\n  &lt;/el-form-item&gt;\n&lt;/el-form&gt;\n\nconst rules = {\n  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],\n  password: [{ required: true, message: "请输入密码", trigger: "blur" }]\n}</code></pre>',
    tags: ['Form', '表单', '验证']
  },
  'ep-input': {
    title: 'Input 输入框',
    body: '<p class="lead">输入框用于用户输入。</p><pre><code>&lt;el-input v-model="input" placeholder="请输入" /&gt;\n&lt;el-input v-model="input" type="password" show-password /&gt;\n&lt;el-input v-model="textarea" type="textarea" :rows="4" /&gt;\n\n&lt;el-input v-model="input" clearable /&gt;\n&lt;el-input v-model="input" disabled /&gt;\n\n&lt;el-input v-model="input" size="large" /&gt;\n&lt;el-input v-model="input" size="small" /&gt;\n\n&lt;el-input v-model="input"&gt;\n  &lt;template #prepend&gt;https://&lt;/template&gt;\n  &lt;template #append&gt;.com&lt;/template&gt;\n&lt;/el-input&gt;</code></pre>',
    tags: ['Input', '输入框', '文本']
  },
  'ep-select': {
    title: 'Select 选择器',
    body: '<p class="lead">选择器用于选择选项。</p><pre><code>&lt;el-select v-model="value" placeholder="请选择"&gt;\n  &lt;el-option label="选项1" value="1" /&gt;\n  &lt;el-option label="选项2" value="2" /&gt;\n  &lt;el-option label="选项3" value="3" /&gt;\n&lt;/el-select&gt;\n\n&lt;el-select v-model="values" multiple placeholder="多选"&gt;\n  &lt;el-option label="选项1" value="1" /&gt;\n  &lt;el-option label="选项2" value="2" /&gt;\n&lt;/el-select&gt;\n\n&lt;el-select v-model="value" filterable placeholder="可搜索"&gt;\n  &lt;el-option label="Apple" value="apple" /&gt;\n  &lt;el-option label="Banana" value="banana" /&gt;\n&lt;/el-select&gt;</code></pre>',
    tags: ['Select', '选择器', '下拉']
  },
  'ep-datepicker': {
    title: 'DatePicker 日期选择',
    body: '<p class="lead">日期选择器用于选择日期。</p><pre><code>&lt;el-date-picker v-model="date" type="date" placeholder="选择日期" /&gt;\n&lt;el-date-picker v-model="week" type="week" placeholder="选择周" /&gt;\n&lt;el-date-picker v-model="month" type="month" placeholder="选择月" /&gt;\n&lt;el-date-picker v-model="year" type="year" placeholder="选择年" /&gt;\n\n&lt;el-date-picker v-model="datetime" type="datetime" placeholder="选择日期时间" /&gt;\n&lt;el-date-picker v-model="daterange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" /&gt;</code></pre>',
    tags: ['DatePicker', '日期选择', '时间']
  },
  'ep-upload': {
    title: 'Upload 上传',
    body: '<p class="lead">上传组件用于文件上传。</p><pre><code>&lt;el-upload action="/upload" :on-success="handleSuccess"&gt;\n  &lt;el-button type="primary"&gt;点击上传&lt;/el-button&gt;\n&lt;/el-upload&gt;\n\n&lt;el-upload\n  action="/upload"\n  list-type="picture-card"\n  :file-list="fileList"\n&gt;\n  &lt;el-icon&gt;&lt;Plus /&gt;&lt;/el-icon&gt;\n&lt;/el-upload&gt;\n\n&lt;el-upload\n  action="/upload"\n  drag\n  multiple\n&gt;\n  &lt;el-icon class="el-icon--upload"&gt;&lt;upload-filled /&gt;&lt;/el-icon&gt;\n  &lt;div class="el-upload__text"&gt;将文件拖到此处，或&lt;em&gt;点击上传&lt;/em&gt;&lt;/div&gt;\n&lt;/el-upload&gt;</code></pre>',
    tags: ['Upload', '上传', '文件']
  },
  'ep-switch': {
    title: 'Switch 开关',
    body: '<p class="lead">开关用于切换状态。</p><pre><code>&lt;el-switch v-model="value" /&gt;\n&lt;el-switch v-model="value" active-text="开启" inactive-text="关闭" /&gt;\n&lt;el-switch v-model="value" active-color="#13ce66" inactive-color="#ff4949" /&gt;\n\n&lt;el-switch v-model="value" disabled /&gt;\n&lt;el-switch v-model="value" loading /&gt;\n\n&lt;el-switch\n  v-model="value"\n  active-value="1"\n  inactive-value="0"\n/&gt;</code></pre>',
    tags: ['Switch', '开关', '切换']
  },
  'ep-checkbox': {
    title: 'Checkbox 复选框',
    body: '<p class="lead">复选框用于多选。</p><pre><code>&lt;el-checkbox v-model="checked"&gt;选项&lt;/el-checkbox&gt;\n\n&lt;el-checkbox-group v-model="checkList"&gt;\n  &lt;el-checkbox label="选项A" /&gt;\n  &lt;el-checkbox label="选项B" /&gt;\n  &lt;el-checkbox label="选项C" /&gt;\n&lt;/el-checkbox-group&gt;\n\n&lt;el-checkbox v-model="checked" disabled&gt;禁用&lt;/el-checkbox&gt;\n&lt;el-checkbox v-model="checked" border&gt;带边框&lt;/el-checkbox&gt;</code></pre>',
    tags: ['Checkbox', '复选框', '多选']
  },
  'ep-radio': {
    title: 'Radio 单选框',
    body: '<p class="lead">单选框用于单选。</p><pre><code>&lt;el-radio v-model="radio" label="1"&gt;选项1&lt;/el-radio&gt;\n&lt;el-radio v-model="radio" label="2"&gt;选项2&lt;/el-radio&gt;\n\n&lt;el-radio-group v-model="radio"&gt;\n  &lt;el-radio label="1"&gt;选项1&lt;/el-radio&gt;\n  &lt;el-radio label="2"&gt;选项2&lt;/el-radio&gt;\n&lt;/el-radio-group&gt;\n\n&lt;el-radio v-model="radio" label="1" disabled&gt;禁用&lt;/el-radio&gt;\n&lt;el-radio v-model="radio" label="2" border&gt;带边框&lt;/el-radio&gt;</code></pre>',
    tags: ['Radio', '单选框', '单选']
  },
  'ep-dialog': {
    title: 'Dialog 对话框',
    body: '<p class="lead">对话框用于重要信息确认。</p><pre><code>&lt;el-button @click="dialogVisible = true"&gt;打开对话框&lt;/el-button&gt;\n\n&lt;el-dialog v-model="dialogVisible" title="对话框标题" width="30%"&gt;\n  &lt;span&gt;对话框内容&lt;/span&gt;\n  &lt;template #footer&gt;\n    &lt;span class="dialog-footer"&gt;\n      &lt;el-button @click="dialogVisible = false"&gt;取消&lt;/el-button&gt;\n      &lt;el-button type="primary" @click="dialogVisible = false"&gt;确认&lt;/el-button&gt;\n    &lt;/span&gt;\n  &lt;/template&gt;\n&lt;/el-dialog&gt;\n\n&lt;el-dialog v-model="dialogVisible" fullscreen&gt;全屏对话框&lt;/el-dialog&gt;</code></pre>',
    tags: ['Dialog', '对话框', '弹窗']
  },
  'ep-message': {
    title: 'Message 消息提示',
    body: '<p class="lead">消息提示用于轻量级反馈。</p><pre><code>import { ElMessage } from "element-plus"\n\nElMessage.success("操作成功！")\nElMessage.error("操作失败！")\nElMessage.warning("警告信息！")\nElMessage.info("提示信息！")\nElMessage("普通消息")\n\nElMessage({\n  message: "这是一条消息",\n  type: "success",\n  duration: 3000,\n  showClose: true\n})</code></pre>',
    tags: ['Message', '消息提示', '反馈']
  },
  'ep-notification': {
    title: 'Notification 通知',
    body: '<p class="lead">通知用于全局提醒。</p><pre><code>import { ElNotification } from "element-plus"\n\nElNotification({\n  title: "标题",\n  message: "这是一条通知消息",\n  type: "success"\n})\n\nElNotification.success({\n  title: "成功",\n  message: "操作成功"\n})\n\nElNotification.error({\n  title: "错误",\n  message: "操作失败"\n})\n\nElNotification({\n  title: "可关闭",\n  message: "点击关闭按钮",\n  showClose: true\n})</code></pre>',
    tags: ['Notification', '通知', '提醒']
  },
  'ep-popconfirm': {
    title: 'Popconfirm 气泡确认',
    body: '<p class="lead">气泡确认用于删除等危险操作。</p><pre><code>&lt;el-popconfirm title="确定要删除吗？" @confirm="handleConfirm"&gt;\n  &lt;template #reference&gt;\n    &lt;el-button type="danger"&gt;删除&lt;/el-button&gt;\n  &lt;/template&gt;\n&lt;/el-popconfirm&gt;\n\n&lt;el-popconfirm\n  title="确认操作"\n  confirm-button-text="确定"\n  cancel-button-text="取消"\n  icon-color="#626AEF"\n&gt;\n  &lt;template #reference&gt;\n    &lt;el-button&gt;确认操作&lt;/el-button&gt;\n  &lt;/template&gt;\n&lt;/el-popconfirm&gt;</code></pre>',
    tags: ['Popconfirm', '气泡确认', '删除']
  },
  'ep-loading': {
    title: 'Loading 加载',
    body: '<p class="lead">加载中用于数据加载状态。</p><pre><code>// 指令方式\n&lt;div v-loading="loading"&gt;内容区域&lt;/div&gt;\n\n// 服务方式\nimport { ElLoading } from "element-plus"\n\nconst loading = ElLoading.service({\n  lock: true,\n  text: "加载中...",\n  background: "rgba(0, 0, 0, 0.7)"\n})\n\nsetTimeout(() => {\n  loading.close()\n}, 2000)\n\n// 局部加载\nconst loading = ElLoading.service({\n  target: ".table-container",\n  fullscreen: false\n})</code></pre>',
    tags: ['Loading', '加载', 'v-loading']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Element Plus 官方文档获取更多信息。</p>',
        tags: ['Element Plus', 'UI组件']
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

addLink('ep-intro', 'ep-install')
addLink('ep-install', 'ep-import')
addLink('ep-import', 'ep-theme')
addLink('ep-button', 'ep-icon')
addLink('ep-icon', 'ep-link')
addLink('ep-link', 'ep-typography')
addLink('ep-container', 'ep-row-col')
addLink('ep-row-col', 'ep-card')
addLink('ep-card', 'ep-divider')
addLink('ep-divider', 'ep-space')
addLink('ep-menu', 'ep-tabs')
addLink('ep-tabs', 'ep-breadcrumb')
addLink('ep-breadcrumb', 'ep-pagination')
addLink('ep-pagination', 'ep-dropdown')
addLink('ep-table', 'ep-tag')
addLink('ep-tag', 'ep-badge')
addLink('ep-badge', 'ep-avatar')
addLink('ep-avatar', 'ep-progress')
addLink('ep-progress', 'ep-tree')
addLink('ep-form', 'ep-input')
addLink('ep-input', 'ep-select')
addLink('ep-select', 'ep-datepicker')
addLink('ep-datepicker', 'ep-upload')
addLink('ep-upload', 'ep-switch')
addLink('ep-switch', 'ep-checkbox')
addLink('ep-checkbox', 'ep-radio')
addLink('ep-dialog', 'ep-message')
addLink('ep-message', 'ep-notification')
addLink('ep-notification', 'ep-popconfirm')
addLink('ep-popconfirm', 'ep-loading')

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