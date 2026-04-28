<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Vuetify 知识库</h1>
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
          <h2>🎨 <span class="gradient-text">Vuetify 完全指南</span></h2>
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
          <p>🎨 基于 Vue 的 Material Design 组件库</p>
          <p>✨ 点击节点双向联动 | 丰富的 UI 组件</p>
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
          <h3>🔗 Vuetify 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Vuetify用户'
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

// ========== Vuetify 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'vuetify-intro', label: 'Vuetify 简介', hot: true },
      { id: 'vuetify-install', label: '安装与配置', hot: true },
      { id: 'vuetify-theme', label: '主题定制', hot: true },
      { id: 'vuetify-icons', label: '图标系统', hot: true }
    ]},
  { title: '📐 布局组件', items: [
      { id: 'vuetify-grid', label: '网格系统', hot: true },
      { id: 'vuetify-container', label: '容器', hot: true },
      { id: 'vuetify-app-bar', label: '应用栏', hot: true },
      { id: 'vuetify-navigation', label: '导航抽屉', hot: true },
      { id: 'vuetify-footer', label: '页脚', hot: true }
    ]},
  { title: '🔘 表单组件', items: [
      { id: 'vuetify-text-field', label: '文本输入框', hot: true },
      { id: 'vuetify-select', label: '选择器', hot: true },
      { id: 'vuetify-checkbox', label: '复选框', hot: true },
      { id: 'vuetify-radio', label: '单选框', hot: true },
      { id: 'vuetify-switch', label: '开关', hot: true },
      { id: 'vuetify-btn', label: '按钮', hot: true }
    ]},
  { title: '📊 数据展示', items: [
      { id: 'vuetify-table', label: '表格', hot: true },
      { id: 'vuetify-card', label: '卡片', hot: true },
      { id: 'vuetify-list', label: '列表', hot: true },
      { id: 'vuetify-chip', label: '芯片', hot: true },
      { id: 'vuetify-badge', label: '徽章', hot: true },
      { id: 'vuetify-avatar', label: '头像', hot: true }
    ]},
  { title: '💬 反馈组件', items: [
      { id: 'vuetify-dialog', label: '对话框', hot: true },
      { id: 'vuetify-snackbar', label: '消息条', hot: true },
      { id: 'vuetify-alert', label: '警告框', hot: true },
      { id: 'vuetify-progress', label: '进度条', hot: true },
      { id: 'vuetify-skeleton', label: '骨架屏', hot: true }
    ]},
  { title: '🎯 导航组件', items: [
      { id: 'vuetify-tabs', label: '标签页', hot: true },
      { id: 'vuetify-menu', label: '菜单', hot: true },
      { id: 'vuetify-pagination', label: '分页', hot: true },
      { id: 'vuetify-stepper', label: '步骤条', hot: true }
    ]}
])

const selectedId = ref('vuetify-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Vuetify 内容映射表 ==========
const contentMap = {
  'vuetify-intro': {
    title: 'Vuetify 简介',
    body: '<p class="lead">Vuetify 是基于 Vue.js 的 Material Design 组件库，提供丰富的 UI 组件和响应式布局系统。</p><h3>核心特点</h3><ul><li><strong>Material Design</strong>：遵循 Google Material Design 规范</li><li><strong>组件丰富</strong>：80+ 高质量组件</li><li><strong>响应式</strong>：内置响应式网格系统</li><li><strong>主题定制</strong>：灵活的样式定制能力</li><li><strong>国际化</strong>：支持多语言</li></ul><div class="note">💡 Vuetify 是 Vue 生态中最流行的 UI 组件库之一。</div>',
    tags: ['Vue', 'Material Design', 'UI组件库']
  },
  'vuetify-install': {
    title: '安装与配置',
    body: '<p class="lead">Vuetify 可以通过 Vue CLI 插件或手动安装。</p><pre><code>// Vue CLI 插件（推荐）\nvue add vuetify\n\n// npm 安装\nnpm install vuetify\n\n// 在 main.js 中配置\nimport { createApp } from "vue"\nimport App from "./App.vue"\nimport vuetify from "./plugins/vuetify"\n\nconst app = createApp(App)\napp.use(vuetify)\napp.mount("#app")\n\n// Vite 配置\nimport vuetify from "vite-plugin-vuetify"\n\nexport default defineConfig({\n  plugins: [\n    vue(),\n    vuetify({ autoImport: true })\n  ]\n})</code></pre>',
    tags: ['安装', '配置', 'Vue CLI']
  },
  'vuetify-theme': {
    title: '主题定制',
    body: '<p class="lead">Vuetify 支持灵活的主题定制。</p><pre><code>// vuetify.js\nimport { createVuetify } from "vuetify"\nimport * as components from "vuetify/components"\nimport * as directives from "vuetify/directives"\n\nexport default createVuetify({\n  components,\n  directives,\n  theme: {\n    defaultTheme: "light",\n    themes: {\n      light: {\n        colors: {\n          primary: "#8B5CF6",\n          secondary: "#6c757d",\n          accent: "#82B1FF",\n          error: "#FF5252",\n          success: "#4CAF50",\n          warning: "#FFC107"\n        }\n      },\n      dark: {\n        colors: {\n          primary: "#a78bfa",\n          background: "#1e1e2f"\n        }\n      }\n    }\n  }\n})\n\n// 动态切换主题\n&lt;v-btn @click="$vuetify.theme.global.name = \'dark\'"&gt;暗色模式&lt;/v-btn&gt;</code></pre>',
    tags: ['主题', '定制', '颜色']
  },
  'vuetify-icons': {
    title: '图标系统',
    body: '<p class="lead">Vuetify 支持多种图标库。</p><pre><code>// 安装图标\nnpm install @mdi/font\n\n// 在 main.js 中引入\nimport "@mdi/font/css/materialdesignicons.css"\n\n// 使用图标\n&lt;v-icon&gt;mdi-home&lt;/v-icon&gt;\n&lt;v-icon&gt;mdi-account&lt;/v-icon&gt;\n&lt;v-icon&gt;mdi-cog&lt;/v-icon&gt;\n\n// 图标大小\n&lt;v-icon size="small"&gt;mdi-heart&lt;/v-icon&gt;\n&lt;v-icon size="large"&gt;mdi-star&lt;/v-icon&gt;\n&lt;v-icon size="x-large"&gt;mdi-check&lt;/v-icon&gt;\n\n// 自定义图标\n&lt;v-icon&gt;\n  &lt;svg viewBox="0 0 24 24"&gt;...&lt;/svg&gt;\n&lt;/v-icon&gt;</code></pre>',
    tags: ['图标', 'Material Icons', 'MDI']
  },
  'vuetify-grid': {
    title: '网格系统',
    body: '<p class="lead">Vuetify 的响应式网格系统基于 12 列布局。</p><pre><code>&lt;v-container&gt;\n  &lt;v-row&gt;\n    &lt;v-col cols="12" md="6" lg="4"&gt;\n      &lt;v-card&gt;列1&lt;/v-card&gt;\n    &lt;/v-col&gt;\n    &lt;v-col cols="12" md="6" lg="4"&gt;\n      &lt;v-card&gt;列2&lt;/v-card&gt;\n    &lt;/v-col&gt;\n  &lt;/v-row&gt;\n\n  &lt;!-- 间距 --&gt;\n  &lt;v-row dense&gt;\n    &lt;v-col&gt;紧凑列&lt;/v-col&gt;\n  &lt;/v-row&gt;\n\n  &lt;!-- 对齐 --&gt;\n  &lt;v-row justify="center" align="center"&gt;\n    &lt;v-col cols="4"&gt;居中列&lt;/v-col&gt;\n  &lt;/v-row&gt;\n&lt;/v-container&gt;</code></pre>',
    tags: ['网格', '响应式', '布局']
  },
  'vuetify-container': {
    title: '容器',
    body: '<p class="lead">容器是布局的基础组件。</p><pre><code>&lt;!-- 流体容器（100%宽度） --&gt;\n&lt;v-container fluid&gt;\n  &lt;v-row&gt;...&lt;/v-row&gt;\n&lt;/v-container&gt;\n\n&lt;!-- 固定宽度容器 --&gt;\n&lt;v-container&gt;\n  &lt;v-row&gt;...&lt;/v-row&gt;\n&lt;/v-container&gt;\n\n&lt;!-- 自定义填充 --&gt;\n&lt;v-container class="fill-height"&gt;\n  &lt;v-row align="center" justify="center"&gt;\n    &lt;v-col&gt;居中内容&lt;/v-col&gt;\n  &lt;/v-row&gt;\n&lt;/v-container&gt;</code></pre>',
    tags: ['容器', 'container', '布局']
  },
  'vuetify-app-bar': {
    title: '应用栏',
    body: '<p class="lead">应用栏提供应用标题和导航控制。</p><pre><code>&lt;v-app-bar color="primary" dense&gt;\n  &lt;v-app-bar-nav-icon @click="drawer = !drawer"&gt;&lt;/v-app-bar-nav-icon&gt;\n  &lt;v-app-bar-title&gt;应用标题&lt;/v-app-bar-title&gt;\n  &lt;v-spacer&gt;&lt;/v-spacer&gt;\n  &lt;v-btn icon&gt;\n    &lt;v-icon&gt;mdi-magnify&lt;/v-icon&gt;\n  &lt;/v-btn&gt;\n  &lt;v-btn icon&gt;\n    &lt;v-icon&gt;mdi-account&lt;/v-icon&gt;\n  &lt;/v-btn&gt;\n&lt;/v-app-bar&gt;</code></pre>',
    tags: ['应用栏', 'app-bar', '导航']
  },
  'vuetify-navigation': {
    title: '导航抽屉',
    body: '<p class="lead">导航抽屉用于侧边栏导航。</p><pre><code>&lt;v-navigation-drawer v-model="drawer" app&gt;\n  &lt;v-list&gt;\n    &lt;v-list-item prepend-icon="mdi-home" title="首页"&gt;&lt;/v-list-item&gt;\n    &lt;v-list-item prepend-icon="mdi-account" title="个人资料"&gt;&lt;/v-list-item&gt;\n    &lt;v-list-item prepend-icon="mdi-cog" title="设置"&gt;&lt;/v-list-item&gt;\n  &lt;/v-list&gt;\n&lt;/v-navigation-drawer&gt;</code></pre>',
    tags: ['导航抽屉', '侧边栏', 'navigation-drawer']
  },
  'vuetify-footer': {
    title: '页脚',
    body: '<p class="lead">页脚组件用于页面底部。</p><pre><code>&lt;v-footer app color="grey-lighten-2"&gt;\n  &lt;v-row justify="center" no-gutters&gt;\n    &lt;v-btn variant="text" class="mx-2"&gt;关于&lt;/v-btn&gt;\n    &lt;v-btn variant="text" class="mx-2"&gt;隐私政策&lt;/v-btn&gt;\n    &lt;v-col class="text-center mt-4" cols="12"&gt;\n      &amp;copy; 2024 Vuetify - 保留所有权利\n    &lt;/v-col&gt;\n  &lt;/v-row&gt;\n&lt;/v-footer&gt;</code></pre>',
    tags: ['页脚', 'footer', '底部']
  },
  'vuetify-text-field': {
    title: '文本输入框',
    body: '<p class="lead">文本输入框组件。</p><pre><code>&lt;v-text-field\n  v-model="name"\n  label="姓名"\n  placeholder="请输入姓名"\n  required\n  clearable\n&gt;&lt;/v-text-field&gt;\n\n&lt;v-text-field\n  v-model="email"\n  label="邮箱"\n  type="email"\n  variant="outlined"\n  prepend-inner-icon="mdi-email"\n&gt;&lt;/v-text-field&gt;\n\n&lt;v-text-field\n  v-model="password"\n  label="密码"\n  type="password"\n  variant="filled"\n  :rules="[v => !!v || \'密码不能为空\']"\n&gt;&lt;/v-text-field&gt;</code></pre>',
    tags: ['输入框', 'text-field', '表单']
  },
  'vuetify-select': {
    title: '选择器',
    body: '<p class="lead">下拉选择组件。</p><pre><code>&lt;v-select\n  v-model="selected"\n  :items="items"\n  label="请选择"\n  variant="outlined"\n&gt;&lt;/v-select&gt;\n\n&lt;v-select\n  v-model="multiple"\n  :items="items"\n  label="多选"\n  multiple\n  chips\n&gt;&lt;/v-select&gt;</code></pre>',
    tags: ['选择器', 'select', '下拉']
  },
  'vuetify-checkbox': {
    title: '复选框',
    body: '<p class="lead">复选框组件。</p><pre><code>&lt;v-checkbox\n  v-model="checked"\n  label="记住我"\n  color="primary"\n&gt;&lt;/v-checkbox&gt;\n\n&lt;v-checkbox\n  v-model="agree"\n  label="我同意服务条款"\n  :rules="[v => !!v || \'必须同意条款\']"\n&gt;&lt;/v-checkbox&gt;</code></pre>',
    tags: ['复选框', 'checkbox', '多选']
  },
  'vuetify-radio': {
    title: '单选框',
    body: '<p class="lead">单选框组件。</p><pre><code>&lt;v-radio-group v-model="gender"&gt;\n  &lt;v-radio label="男" value="male"&gt;&lt;/v-radio&gt;\n  &lt;v-radio label="女" value="female"&gt;&lt;/v-radio&gt;\n  &lt;v-radio label="其他" value="other"&gt;&lt;/v-radio&gt;\n&lt;/v-radio-group&gt;</code></pre>',
    tags: ['单选框', 'radio', '单选']
  },
  'vuetify-switch': {
    title: '开关',
    body: '<p class="lead">开关组件。</p><pre><code>&lt;v-switch\n  v-model="switch1"\n  label="通知"\n  color="success"\n&gt;&lt;/v-switch&gt;\n\n&lt;v-switch\n  v-model="switch2"\n  label="暗色模式"\n  inset\n&gt;&lt;/v-switch&gt;</code></pre>',
    tags: ['开关', 'switch', '切换']
  },
  'vuetify-btn': {
    title: '按钮',
    body: '<p class="lead">按钮组件，支持多种样式和状态。</p><pre><code>&lt;v-btn color="primary"&gt;主要按钮&lt;/v-btn&gt;\n&lt;v-btn color="secondary"&gt;次要按钮&lt;/v-btn&gt;\n&lt;v-btn color="success"&gt;成功按钮&lt;/v-btn&gt;\n&lt;v-btn color="error"&gt;错误按钮&lt;/v-btn&gt;\n\n&lt;!-- 按钮变体 --&gt;\n&lt;v-btn variant="flat"&gt;平面按钮&lt;/v-btn&gt;\n&lt;v-btn variant="text"&gt;文本按钮&lt;/v-btn&gt;\n&lt;v-btn variant="outlined"&gt;轮廓按钮&lt;/v-btn&gt;\n&lt;v-btn variant="tonal"&gt;色调按钮&lt;/v-btn&gt;\n\n&lt;!-- 图标按钮 --&gt;\n&lt;v-btn icon="mdi-heart"&gt;&lt;/v-btn&gt;\n\n&lt;!-- 加载状态 --&gt;\n&lt;v-btn loading disabled&gt;加载中&lt;/v-btn&gt;</code></pre>',
    tags: ['按钮', 'button', 'v-btn']
  },
  'vuetify-table': {
    title: '表格',
    body: '<p class="lead">功能强大的表格组件。</p><pre><code>&lt;v-data-table\n  :headers="headers"\n  :items="desserts"\n  :items-per-page="5"\n  class="elevation-1"\n&gt;\n  &lt;template v-slot:item.action="{ item }"&gt;\n    &lt;v-icon small class="mr-2" @click="editItem(item)"&gt;mdi-pencil&lt;/v-icon&gt;\n    &lt;v-icon small @click="deleteItem(item)"&gt;mdi-delete&lt;/v-icon&gt;\n  &lt;/template&gt;\n&lt;/v-data-table&gt;</code></pre>',
    tags: ['表格', 'table', '数据展示']
  },
  'vuetify-card': {
    title: '卡片',
    body: '<p class="lead">卡片组件用于展示内容。</p><pre><code>&lt;v-card max-width="344" class="mx-auto"&gt;\n  &lt;v-img src="image.jpg" height="200" cover&gt;&lt;/v-img&gt;\n  \n  &lt;v-card-title&gt;卡片标题&lt;/v-card-title&gt;\n  \n  &lt;v-card-subtitle&gt;副标题&lt;/v-card-subtitle&gt;\n  \n  &lt;v-card-text&gt;\n    卡片内容描述文字，可以包含多行文本。\n  &lt;/v-card-text&gt;\n  \n  &lt;v-card-actions&gt;\n    &lt;v-btn color="primary" variant="text"&gt;操作1&lt;/v-btn&gt;\n    &lt;v-btn color="primary" variant="text"&gt;操作2&lt;/v-btn&gt;\n  &lt;/v-card-actions&gt;\n&lt;/v-card&gt;</code></pre>',
    tags: ['卡片', 'card', '容器']
  },
  'vuetify-list': {
    title: '列表',
    body: '<p class="lead">列表组件用于展示条目。</p><pre><code>&lt;v-list&gt;\n  &lt;v-list-item\n    v-for="item in items"\n    :key="item.title"\n    :title="item.title"\n    :subtitle="item.subtitle"\n    prepend-icon="mdi-account"\n    append-icon="mdi-chevron-right"\n  &gt;&lt;/v-list-item&gt;\n&lt;/v-list&gt;</code></pre>',
    tags: ['列表', 'list', '条目']
  },
  'vuetify-chip': {
    title: '芯片',
    body: '<p class="lead">芯片组件用于标签和选择。</p><pre><code>&lt;v-chip class="ma-2" color="primary"&gt;标签&lt;/v-chip&gt;\n&lt;v-chip class="ma-2" color="success"&gt;成功&lt;/v-chip&gt;\n&lt;v-chip class="ma-2" color="error" closable&gt;可关闭&lt;/v-chip&gt;\n\n&lt;v-chip-group v-model="selected"&gt;\n  &lt;v-chip filter value="option1"&gt;选项1&lt;/v-chip&gt;\n  &lt;v-chip filter value="option2"&gt;选项2&lt;/v-chip&gt;\n&lt;/v-chip-group&gt;</code></pre>',
    tags: ['芯片', 'chip', '标签']
  },
  'vuetify-badge': {
    title: '徽章',
    body: '<p class="lead">徽章组件用于显示计数。</p><pre><code>&lt;v-badge :content="12" color="error"&gt;\n  &lt;v-icon&gt;mdi-bell&lt;/v-icon&gt;\n&lt;/v-badge&gt;\n\n&lt;v-badge dot color="success"&gt;\n  &lt;v-icon&gt;mdi-message&lt;/v-icon&gt;\n&lt;/v-badge&gt;\n\n&lt;v-badge :content="99" :max="99"&gt;\n  &lt;v-icon&gt;mdi-account&lt;/v-icon&gt;\n&lt;/v-badge&gt;</code></pre>',
    tags: ['徽章', 'badge', '计数']
  },
  'vuetify-avatar': {
    title: '头像',
    body: '<p class="lead">头像组件用于展示用户图片。</p><pre><code>&lt;v-avatar color="primary" size="40"&gt;\n  &lt;v-icon icon="mdi-account"&gt;&lt;/v-icon&gt;\n&lt;/v-avatar&gt;\n\n&lt;v-avatar size="50"&gt;\n  &lt;img src="avatar.jpg" alt="avatar"&gt;\n&lt;/v-avatar&gt;\n\n&lt;v-avatar color="success" size="36" rounded="0"&gt;AB&lt;/v-avatar&gt;</code></pre>',
    tags: ['头像', 'avatar', '图片']
  },
  'vuetify-dialog': {
    title: '对话框',
    body: '<p class="lead">对话框组件用于弹窗交互。</p><pre><code>&lt;v-dialog v-model="dialog" max-width="500"&gt;\n  &lt;template v-slot:activator="{ props }"&gt;\n    &lt;v-btn color="primary" v-bind="props"&gt;打开对话框&lt;/v-btn&gt;\n  &lt;/template&gt;\n\n  &lt;v-card&gt;\n    &lt;v-card-title&gt;对话框标题&lt;/v-card-title&gt;\n    &lt;v-card-text&gt;对话框内容&lt;/v-card-text&gt;\n    &lt;v-card-actions&gt;\n      &lt;v-spacer&gt;&lt;/v-spacer&gt;\n      &lt;v-btn color="error" variant="text" @click="dialog = false"&gt;取消&lt;/v-btn&gt;\n      &lt;v-btn color="primary" variant="text" @click="confirm"&gt;确认&lt;/v-btn&gt;\n    &lt;/v-card-actions&gt;\n  &lt;/v-card&gt;\n&lt;/v-dialog&gt;</code></pre>',
    tags: ['对话框', 'dialog', '弹窗']
  },
  'vuetify-snackbar': {
    title: '消息条',
    body: '<p class="lead">消息条用于临时提示。</p><pre><code>&lt;v-snackbar v-model="snackbar" :timeout="3000" color="success"&gt;\n  {{ snackbarText }}\n  &lt;template v-slot:actions&gt;\n    &lt;v-btn color="white" variant="text" @click="snackbar = false"&gt;关闭&lt;/v-btn&gt;\n  &lt;/template&gt;\n&lt;/v-snackbar&gt;</code></pre>',
    tags: ['消息条', 'snackbar', '提示']
  },
  'vuetify-alert': {
    title: '警告框',
    body: '<p class="lead">警告框用于显示重要信息。</p><pre><code>&lt;v-alert type="success" title="成功" text="操作成功完成"&gt;&lt;/v-alert&gt;\n&lt;v-alert type="error" title="错误" text="操作失败"&gt;&lt;/v-alert&gt;\n&lt;v-alert type="warning" title="警告" text="请注意"&gt;&lt;/v-alert&gt;\n&lt;v-alert type="info" title="信息" text="这是一条信息"&gt;&lt;/v-alert&gt;</code></pre>',
    tags: ['警告框', 'alert', '消息']
  },
  'vuetify-progress': {
    title: '进度条',
    body: '<p class="lead">进度条组件。</p><pre><code>&lt;v-progress-linear v-model="progress" color="primary"&gt;&lt;/v-progress-linear&gt;\n\n&lt;v-progress-circular\n  :size="50"\n  :width="7"\n  :model-value="progress"\n  color="primary"\n&gt;&lt;/v-progress-circular&gt;</code></pre>',
    tags: ['进度条', 'progress', '加载']
  },
  'vuetify-skeleton': {
    title: '骨架屏',
    body: '<p class="lead">骨架屏用于加载占位。</p><pre><code>&lt;v-skeleton-loader type="card"&gt;&lt;/v-skeleton-loader&gt;\n\n&lt;v-skeleton-loader\n  :loading="loading"\n  type="list-item-avatar, article"\n  transition="fade-transition"\n&gt;\n  &lt;v-card&gt;实际内容&lt;/v-card&gt;\n&lt;/v-skeleton-loader&gt;</code></pre>',
    tags: ['骨架屏', 'skeleton', '加载占位']
  },
  'vuetify-tabs': {
    title: '标签页',
    body: '<p class="lead">标签页用于切换内容。</p><pre><code>&lt;v-tabs v-model="tab" color="primary"&gt;\n  &lt;v-tab value="tab1"&gt;标签1&lt;/v-tab&gt;\n  &lt;v-tab value="tab2"&gt;标签2&lt;/v-tab&gt;\n  &lt;v-tab value="tab3"&gt;标签3&lt;/v-tab&gt;\n&lt;/v-tabs&gt;\n\n&lt;v-window v-model="tab"&gt;\n  &lt;v-window-item value="tab1"&gt;内容1&lt;/v-window-item&gt;\n  &lt;v-window-item value="tab2"&gt;内容2&lt;/v-window-item&gt;\n  &lt;v-window-item value="tab3"&gt;内容3&lt;/v-window-item&gt;\n&lt;/v-window&gt;</code></pre>',
    tags: ['标签页', 'tabs', '切换']
  },
  'vuetify-menu': {
    title: '菜单',
    body: '<p class="lead">菜单组件。</p><pre><code>&lt;v-menu&gt;\n  &lt;template v-slot:activator="{ props }"&gt;\n    &lt;v-btn color="primary" v-bind="props"&gt;打开菜单&lt;/v-btn&gt;\n  &lt;/template&gt;\n\n  &lt;v-list&gt;\n    &lt;v-list-item @click="handleClick"&gt;\n      &lt;v-list-item-title&gt;选项1&lt;/v-list-item-title&gt;\n    &lt;/v-list-item&gt;\n    &lt;v-list-item @click="handleClick"&gt;\n      &lt;v-list-item-title&gt;选项2&lt;/v-list-item-title&gt;\n    &lt;/v-list-item&gt;\n  &lt;/v-list&gt;\n&lt;/v-menu&gt;</code></pre>',
    tags: ['菜单', 'menu', '下拉']
  },
  'vuetify-pagination': {
    title: '分页',
    body: '<p class="lead">分页组件。</p><pre><code>&lt;v-pagination\n  v-model="page"\n  :length="10"\n  :total-visible="7"\n  color="primary"\n&gt;&lt;/v-pagination&gt;</code></pre>',
    tags: ['分页', 'pagination', '翻页']
  },
  'vuetify-stepper': {
    title: '步骤条',
    body: '<p class="lead">步骤条组件。</p><pre><code>&lt;v-stepper v-model="step"&gt;\n  &lt;v-stepper-header&gt;\n    &lt;v-stepper-item title="步骤1" value="1"&gt;&lt;/v-stepper-item&gt;\n    &lt;v-divider&gt;&lt;/v-divider&gt;\n    &lt;v-stepper-item title="步骤2" value="2"&gt;&lt;/v-stepper-item&gt;\n    &lt;v-divider&gt;&lt;/v-divider&gt;\n    &lt;v-stepper-item title="步骤3" value="3"&gt;&lt;/v-stepper-item&gt;\n  &lt;/v-stepper-header&gt;\n\n  &lt;v-stepper-window&gt;\n    &lt;v-stepper-window-item value="1"&gt;步骤1内容&lt;/v-stepper-window-item&gt;\n    &lt;v-stepper-window-item value="2"&gt;步骤2内容&lt;/v-stepper-window-item&gt;\n    &lt;v-stepper-window-item value="3"&gt;步骤3内容&lt;/v-stepper-window-item&gt;\n  &lt;/v-stepper-window&gt;\n&lt;/v-stepper&gt;</code></pre>',
    tags: ['步骤条', 'stepper', '向导']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Vuetify 官方文档获取更多信息。</p>',
        tags: ['Vuetify', 'UI组件']
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

addLink('vuetify-intro', 'vuetify-install')
addLink('vuetify-install', 'vuetify-theme')
addLink('vuetify-theme', 'vuetify-icons')
addLink('vuetify-grid', 'vuetify-container')
addLink('vuetify-container', 'vuetify-app-bar')
addLink('vuetify-app-bar', 'vuetify-navigation')
addLink('vuetify-navigation', 'vuetify-footer')
addLink('vuetify-text-field', 'vuetify-select')
addLink('vuetify-select', 'vuetify-checkbox')
addLink('vuetify-checkbox', 'vuetify-radio')
addLink('vuetify-radio', 'vuetify-switch')
addLink('vuetify-switch', 'vuetify-btn')
addLink('vuetify-table', 'vuetify-card')
addLink('vuetify-card', 'vuetify-list')
addLink('vuetify-list', 'vuetify-chip')
addLink('vuetify-chip', 'vuetify-badge')
addLink('vuetify-badge', 'vuetify-avatar')
addLink('vuetify-dialog', 'vuetify-snackbar')
addLink('vuetify-snackbar', 'vuetify-alert')
addLink('vuetify-alert', 'vuetify-progress')
addLink('vuetify-progress', 'vuetify-skeleton')
addLink('vuetify-tabs', 'vuetify-menu')
addLink('vuetify-menu', 'vuetify-pagination')
addLink('vuetify-pagination', 'vuetify-stepper')

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