<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Sass/SCSS 知识库</h1>
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
          <h2>🎨 <span class="gradient-text">Sass/SCSS 完全指南</span></h2>
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
          <p>🎨 CSS 预处理器 | 编写更优雅的样式</p>
          <p>✨ 点击节点双向联动 | 变量、嵌套、混合、函数</p>
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
          <h3>🔗 Sass/SCSS 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Sass用户'
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

// ========== Sass/SCSS 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'sass-intro', label: 'Sass 简介', hot: true },
      { id: 'sass-install', label: '安装与编译', hot: true },
      { id: 'sass-syntax', label: '语法格式', hot: true }
    ]},
  { title: '📝 基础语法', items: [
      { id: 'sass-variables', label: '变量', hot: true },
      { id: 'sass-nesting', label: '嵌套规则', hot: true },
      { id: 'sass-parent', label: '父选择器 &', hot: true },
      { id: 'sass-comments', label: '注释', hot: true }
    ]},
  { title: '🧩 数据类型与运算', items: [
      { id: 'sass-data-types', label: '数据类型', hot: true },
      { id: 'sass-operators', label: '运算符', hot: true },
      { id: 'sass-interpolation', label: '插值语法', hot: true }
    ]},
  { title: '🔄 代码复用', items: [
      { id: 'sass-mixins', label: '混合 Mixin', hot: true },
      { id: 'sass-include', label: '@include 引入', hot: true },
      { id: 'sass-extend', label: '继承 @extend', hot: true },
      { id: 'sass-placeholder', label: '占位符 %', hot: true }
    ]},
  { title: '📦 模块化', items: [
      { id: 'sass-partials', label: '部分文件', hot: true },
      { id: 'sass-import', label: '@import', hot: true },
      { id: 'sass-use', label: '@use 模块', hot: true },
      { id: 'sass-forward', label: '@forward 转发', hot: true }
    ]},
  { title: '⚙️ 控制指令', items: [
      { id: 'sass-if', label: '@if / @else', hot: true },
      { id: 'sass-for', label: '@for 循环', hot: true },
      { id: 'sass-each', label: '@each 循环', hot: true },
      { id: 'sass-while', label: '@while 循环', hot: true }
    ]},
  { title: '🔧 函数与指令', items: [
      { id: 'sass-functions', label: '内置函数', hot: true },
      { id: 'sass-custom-functions', label: '自定义函数', hot: true },
      { id: 'sass-at-root', label: '@at-root', hot: true },
      { id: 'sass-warn-error', label: '@warn / @error', hot: true }
    ]}
])

const selectedId = ref('sass-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Sass/SCSS 内容映射表 ==========
const contentMap = {
  'sass-intro': {
    title: 'Sass 简介',
    body: '<p class="lead">Sass（Syntactically Awesome Style Sheets）是 CSS 预处理器，扩展了 CSS 功能，提供变量、嵌套、混合、函数等特性。</p><h3>核心特点</h3><ul><li><strong>变量</strong>：存储可重用的值</li><li><strong>嵌套</strong>：反映 HTML 层级结构</li><li><strong>混合</strong>：复用代码块</li><li><strong>继承</strong>：共享样式规则</li><li><strong>函数</strong>：内置颜色、数学等函数</li></ul><div class="note">💡 Sass 由 Hampton Catlin 设计，Natalie Weizenbaum 开发，是目前最流行的 CSS 预处理器。</div>',
    tags: ['CSS预处理器', 'SCSS', 'Sass']
  },
  'sass-install': {
    title: '安装与编译',
    body: '<p class="lead">Sass 可以通过多种方式安装和使用。</p><pre><code>// npm 安装\nnpm install -g sass\n\n// 编译命令\nsass input.scss output.css\nsass --watch input.scss output.css\nsass --watch src:dist\n\n// 编译选项\nsass --style=expanded style.scss style.css\nsass --style=compressed style.scss style.min.css\n\n// 监听目录\nsass --watch app/sass:public/stylesheets\n\n// 在 Vue/React 中使用\nnpm install -D sass\n// 或 npm install -D sass-loader</code></pre>',
    tags: ['安装', '编译', '命令行']
  },
  'sass-syntax': {
    title: '语法格式',
    body: '<p class="lead">Sass 支持两种语法格式：SCSS 和缩进语法。</p><pre><code>// SCSS 语法（推荐）\n$primary-color: #333;\n.container {\n  width: 100%;\n  .item {\n    color: $primary-color;\n  }\n}\n\n// 缩进语法（Sass）\n$primary-color: #333\n.container\n  width: 100%\n  .item\n    color: $primary-color\n\n// 文件扩展名\n// .scss - SCSS 语法\n// .sass - 缩进语法</code></pre>',
    tags: ['SCSS', '缩进语法', '语法']
  },
  'sass-variables': {
    title: '变量',
    body: '<p class="lead">Sass 变量以 $ 开头，用于存储可重用的值。</p><pre><code>// 定义变量\n$primary-color: #3498db;\n$font-stack: "Helvetica", sans-serif;\n$border-radius: 4px;\n$padding: 16px;\n\n// 使用变量\n.button {\n  background-color: $primary-color;\n  font-family: $font-stack;\n  border-radius: $border-radius;\n  padding: $padding;\n}\n\n// 变量作用域\n$global: 10px;\n.container {\n  $local: 20px;  // 局部变量\n  width: $global;\n  height: $local;\n}\n\n// !default 标志\n$primary-color: #3498db !default;</code></pre>',
    tags: ['变量', '$', '作用域']
  },
  'sass-nesting': {
    title: '嵌套规则',
    body: '<p class="lead">嵌套反映 HTML 结构，使 CSS 更清晰。</p><pre><code>// SCSS 嵌套\nnav {\n  ul {\n    margin: 0;\n    li {\n      display: inline-block;\n      a {\n        text-decoration: none;\n      }\n    }\n  }\n}\n\n// 编译后 CSS\nnav ul { margin: 0; }\nnav ul li { display: inline-block; }\nnav ul li a { text-decoration: none; }\n\n// 属性嵌套\nfont: {\n  family: "Inter", sans-serif;\n  size: 16px;\n  weight: bold;\n}\n\n// 编译后\nfont-family: "Inter", sans-serif;\nfont-size: 16px;\nfont-weight: bold;</code></pre>',
    tags: ['嵌套', '层级', 'CSS结构']
  },
  'sass-parent': {
    title: '父选择器 &',
    body: '<p class="lead">父选择器 & 表示嵌套的外层选择器。</p><pre><code>// 基本用法\n.button {\n  background: blue;\n  &--large {\n    font-size: 20px;\n  }\n  &:hover {\n    background: darkblue;\n  }\n  &-icon {\n    margin-right: 8px;\n  }\n}\n\n// 编译后\n.button { background: blue; }\n.button--large { font-size: 20px; }\n.button:hover { background: darkblue; }\n.button-icon { margin-right: 8px; }\n\n// 组合选择器\n.parent {\n  & > &__child {\n    color: red;\n  }\n}\n\n// 多级 &\n.main {\n  & &-title {\n    font-weight: bold;\n  }\n}</code></pre>',
    tags: ['父选择器', '&', 'BEM']
  },
  'sass-comments': {
    title: '注释',
    body: '<p class="lead">Sass 支持单行注释和多行注释。</p><pre><code>// 单行注释（不会编译到 CSS）\n/* 多行注释（会编译到 CSS）*/\n/*! 重要注释（压缩时也会保留）*/\n\n$primary: #333;\n\n// 这是样式说明\n.button {\n  /* 按钮样式 */\n  color: $primary;\n}\n\n/*!\n * 版权声明\n * 作者: xxx\n * 版本: 1.0.0\n */</code></pre>',
    tags: ['注释', '单行', '多行']
  },
  'sass-data-types': {
    title: '数据类型',
    body: '<p class="lead">Sass 支持多种数据类型。</p><pre><code>// 数字（带或不带单位）\n$size: 16px;\n$width: 100%;\n$number: 10;\n\n// 字符串\n$name: "Helvetica";\n$font: sans-serif;\n\n// 颜色\n$red: #ff0000;\n$blue: rgb(0,0,255);\n$green: hsl(120,100%,50%);\n\n// 布尔值\n$is-dark: true;\n$is-light: false;\n\n// 列表\n$sizes: 10px, 20px, 30px;\n$colors: red, green, blue;\n\n// 映射（Map）\n$theme: (\n  "primary": #3498db,\n  "secondary": #2ecc71,\n  "danger": #e74c3c\n);\n\n// null\n$empty: null;</code></pre>',
    tags: ['数据类型', '列表', '映射']
  },
  'sass-operators': {
    title: '运算符',
    body: '<p class="lead">Sass 支持数学运算符和字符串运算。</p><pre><code>// 数学运算\n$width: 100px;\n.container {\n  width: $width / 2;          // 50px\n  padding: 10px + 5px;        // 15px\n  margin: 20px - 5px;         // 15px\n  transform: rotate(15deg * 2); // 30deg\n}\n\n// 字符串运算\n$prefix: "btn-";\n.button {\n  &-#{$prefix}primary {\n    color: red;\n  }\n}\n\n// 颜色运算\n$color: #ff0000;\n.darken {\n  color: $color + #333333;    // #ff3333\n}\n\n// 关系运算\n@if 10px > 5px {\n  .large { font-size: 20px; }\n}</code></pre>',
    tags: ['运算符', '数学运算', '字符串']
  },
  'sass-interpolation': {
    title: '插值语法',
    body: '<p class="lead">插值 #{ } 在字符串中插入 SassScript 值。</p><pre><code>// 动态选择器\n$name: "primary";\n.btn-#{$name} {\n  background: blue;\n}\n\n// 动态属性名\n$attr: "border-radius";\n.element {\n  #{$attr}: 8px;\n}\n\n// 动态值\n$size: 16;\n.font {\n  font-size: #{$size}px;\n}\n\n// 注释中使用\n/* 版本: #{$version} */\n\n// 媒体查询\n$device: "screen";\n@media #{$device} {\n  .responsive { width: 100%; }\n}</code></pre>',
    tags: ['插值', '#{}', '动态']
  },
  'sass-mixins': {
    title: '混合 Mixin',
    body: '<p class="lead">Mixin 是可复用的代码块，可以接受参数。</p><pre><code>// 定义 Mixin\n@mixin border-radius($radius) {\n  border-radius: $radius;\n}\n\n@mixin flex-center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n@mixin respond-to($breakpoint) {\n  @if $breakpoint == "mobile" {\n    @media (max-width: 768px) { @content; }\n  }\n}\n\n// 使用 Mixin\n.button {\n  @include border-radius(4px);\n  @include flex-center;\n  @include respond-to("mobile") {\n    width: 100%;\n  }\n}</code></pre>',
    tags: ['Mixin', '@mixin', '@include']
  },
  'sass-include': {
    title: '@include 引入',
    body: '<p class="lead">@include 用于引入 Mixin，支持参数传递。</p><pre><code>// 定义 Mixin\n@mixin box($width, $height: auto, $color: blue) {\n  width: $width;\n  height: $height;\n  background: $color;\n}\n\n// 使用参数\n.card {\n  @include box(100px, 200px, red);\n}\n\n// 使用关键字参数\n.avatar {\n  @include box($width: 50px, $color: green);\n}\n\n// 可变参数\n@mixin shadow($shadows...) {\n  box-shadow: $shadows;\n}\n\n.element {\n  @include shadow(0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1));\n}\n\n// 内容块传递\n@mixin hover {\n  &:hover { @content; }\n}\n\n.button {\n  @include hover {\n    background: darkblue;\n  }\n}</code></pre>',
    tags: ['@include', '参数传递', '内容块']
  },
  'sass-extend': {
    title: '继承 @extend',
    body: '<p class="lead">@extend 让一个选择器继承另一个选择器的样式。</p><pre><code>// 基础样式\n%button-base {\n  padding: 10px 20px;\n  border: none;\n  cursor: pointer;\n}\n\n.button-primary {\n  @extend %button-base;\n  background: blue;\n  color: white;\n}\n\n.button-secondary {\n  @extend %button-base;\n  background: gray;\n}\n\n// 编译后 CSS\n.button-primary, .button-secondary {\n  padding: 10px 20px;\n  border: none;\n  cursor: pointer;\n}\n\n.button-primary {\n  background: blue;\n  color: white;\n}\n\n.button-secondary {\n  background: gray;\n}</code></pre>',
    tags: ['@extend', '继承', '复用']
  },
  'sass-placeholder': {
    title: '占位符 %',
    body: '<p class="lead">占位符选择器 % 不会被编译为 CSS，只有被 @extend 时才生成。</p><pre><code>// 定义占位符\n%clearfix {\n  &::after {\n    content: "";\n    display: table;\n    clear: both;\n  }\n}\n\n%text-truncate {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n// 使用继承\n.container {\n  @extend %clearfix;\n}\n\n.title {\n  @extend %text-truncate;\n}\n\n// 占位符不会被单独编译\n// 只有被继承的占位符才会出现在 CSS 中</code></pre>',
    tags: ['占位符', '%', 'placeholder']
  },
  'sass-partials': {
    title: '部分文件',
    body: '<p class="lead">部分文件以下划线开头，不会被单独编译成 CSS。</p><pre><code>// _variables.scss\n$primary: #3498db;\n$font-stack: "Inter", sans-serif;\n\n// _mixins.scss\n@mixin flex-center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n// _reset.scss\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\n// main.scss（入口文件）\n@import "variables";\n@import "mixins";\n@import "reset";\n\nbody {\n  font-family: $font-stack;\n}\n\n.container {\n  @include flex-center;\n}</code></pre>',
    tags: ['部分文件', '_partial', '导入']
  },
  'sass-import': {
    title: '@import',
    body: '<p class="lead">@import 用于导入其他 Sass 文件（旧版模块系统）。</p><pre><code>// 导入部分文件（可省略下划线和扩展名）\n@import "variables";\n@import "mixins";\n@import "reset";\n\n// 导入多个文件\n@import "header", "footer", "sidebar";\n\n// 导入 CSS 文件（会生成 @import 语句）\n@import "normalize.css";\n\n// 嵌套导入\n.section {\n  @import "section-theme";\n}\n\n// 注意：@import 已被 @use 和 @forward 取代\n// 新项目推荐使用 @use 模块系统</code></pre>',
    tags: ['@import', '导入', '合并']
  },
  'sass-use': {
    title: '@use 模块',
    body: '<p class="lead">@use 是 Sass 的新模块系统，推荐替代 @import。</p><pre><code>// _variables.scss\n$primary: #3498db;\n$secondary: #2ecc71;\n\n// _mixins.scss\n@mixin flex-center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n// main.scss\n@use "variables" as vars;\n@use "mixins" as m;\n\n.button {\n  background: vars.$primary;\n  @include m.flex-center;\n}\n\n// 使用命名空间\n.element {\n  color: variables.$primary;\n}\n\n// 不加命名空间\n@use "utils" as *;\n\n.card {\n  @include flex-center;\n}</code></pre>',
    tags: ['@use', '模块', '命名空间']
  },
  'sass-forward': {
    title: '@forward 转发',
    body: '<p class="lead">@forward 用于将多个模块的成员集中导出。</p><pre><code>// _colors.scss\n$primary: #3498db;\n$secondary: #2ecc71;\n\n// _spacing.scss\n$spacing-sm: 8px;\n$spacing-md: 16px;\n$spacing-lg: 24px;\n\n// index.scss（入口文件）\n@forward "colors";\n@forward "spacing";\n\n// 使用\n@use "index" as *;\n\n.container {\n  color: $primary;\n  padding: $spacing-md;\n}\n\n// 转发时添加前缀\n@forward "colors" as colors-*;\n\n// 转发时隐藏某些成员\n@forward "utils" hide $private-var;</code></pre>',
    tags: ['@forward', '转发', '模块导出']
  },
  'sass-if': {
    title: '@if / @else',
    body: '<p class="lead">条件控制指令，根据条件输出不同样式。</p><pre><code>// 基本用法\n$theme: "dark";\n\n.button {\n  @if $theme == "dark" {\n    background: #333;\n    color: white;\n  } @else if $theme == "light" {\n    background: #fff;\n    color: #333;\n  } @else {\n    background: gray;\n  }\n}\n\n// 在 Mixin 中使用\n@mixin responsive($breakpoint) {\n  @if $breakpoint == "mobile" {\n    @media (max-width: 768px) { @content; }\n  } @else if $breakpoint == "tablet" {\n    @media (min-width: 769px) and (max-width: 1024px) { @content; }\n  }\n}\n\n.container {\n  @include responsive("mobile") {\n    width: 100%;\n  }\n}</code></pre>',
    tags: ['@if', '@else', '条件判断']
  },
  'sass-for': {
    title: '@for 循环',
    body: '<p class="lead">@for 循环用于重复生成样式。</p><pre><code>// 从 start 到 end（包含 end）\n@for $i from 1 through 3 {\n  .col-#{$i} {\n    width: 100% / 3 * $i;\n  }\n}\n\n// 从 start 到 end（不包含 end）\n@for $i from 1 to 4 {\n  .item-#{$i} {\n    z-index: $i;\n  }\n}\n\n// 实用示例\n$columns: 12;\n@for $i from 1 through $columns {\n  .col-#{$i} {\n    width: percentage($i / $columns);\n  }\n}\n\n// 生成过渡延迟\n@for $i from 1 through 10 {\n  .item-#{$i} {\n    transition-delay: #{$i * 0.1}s;\n  }\n}</code></pre>',
    tags: ['@for', '循环', '生成']
  },
  'sass-each': {
    title: '@each 循环',
    body: '<p class="lead">@each 循环用于遍历列表或映射。</p><pre><code>// 遍历列表\n$colors: red, green, blue;\n@each $color in $colors {\n  .btn-#{$color} {\n    background: $color;\n  }\n}\n\n// 遍历映射\n$sizes: (\n  "small": 12px,\n  "medium": 16px,\n  "large": 20px\n);\n@each $name, $size in $sizes {\n  .text-#{$name} {\n    font-size: $size;\n  }\n}\n\n// 多值遍历\n$breakpoints: (\n  "sm": 576px,\n  "md": 768px,\n  "lg": 992px\n);\n@each $prefix, $value in $breakpoints {\n  @media (min-width: $value) {\n    .container-#{$prefix} {\n      max-width: $value;\n    }\n  }\n}</code></pre>',
    tags: ['@each', '遍历', '列表']
  },
  'sass-while': {
    title: '@while 循环',
    body: '<p class="lead">@while 循环根据条件重复执行。</p><pre><code>// 基本用法\n$i: 6;\n@while $i > 0 {\n  .item-#{$i} {\n    z-index: $i;\n  }\n  $i: $i - 1;\n}\n\n// 生成网格\n$columns: 12;\n$i: 1;\n@while $i <= $columns {\n  .col-#{$i} {\n    width: ($i / $columns) * 100%;\n  }\n  $i: $i + 1;\n}\n\n// 注意：@while 不如 @for 常用\n// 大多数情况使用 @for 或 @each 更清晰</code></pre>',
    tags: ['@while', '循环', '条件']
  },
  'sass-functions': {
    title: '内置函数',
    body: '<p class="lead">Sass 提供丰富的内置函数。</p><pre><code>// 颜色函数\n$color: #3498db;\n.darken {\n  color: darken($color, 20%);\n  background: lighten($color, 20%);\n  border-color: saturate($color, 50%);\n  box-shadow: rgba($color, 0.5);\n}\n\n// 字符串函数\n$str: "Hello World";\n.str {\n  content: str-index($str, "World");  // 7\n  content: str-length($str);           // 11\n  content: to-upper-case($str);        // "HELLO WORLD"\n}\n\n// 数字函数\n$num: 10px;\n.math {\n  width: ceil(10.2px);     // 11px\n  height: floor(10.8px);   // 10px\n  margin: round(10.5px);   // 11px\n}\n\n// 列表函数\n$list: 10px, 20px, 30px;\n.first {\n  padding: nth($list, 1);   // 10px\n  length: length($list);    // 3\n}\n\n// 映射函数\n$map: ("a": 1, "b": 2);\n.value {\n  value: map-get($map, "a");  // 1\n}</code></pre>',
    tags: ['函数', '颜色函数', '字符串']
  },
  'sass-custom-functions': {
    title: '自定义函数',
    body: '<p class="lead">使用 @function 创建自定义函数。</p><pre><code>// 定义函数\n@function px-to-rem($px, $base: 16px) {\n  @return $px / $base * 1rem;\n}\n\n@function calculate-width($columns, $total: 12) {\n  @return percentage($columns / $total);\n}\n\n@function strip-unit($number) {\n  @return $number / ($number * 0 + 1);\n}\n\n// 使用函数\n.container {\n  font-size: px-to-rem(16px);\n  width: calculate-width(6);  // 50%\n}\n\n.element {\n  $value: 16px;\n  $unitless: strip-unit($value);  // 16\n}</code></pre>',
    tags: ['@function', '自定义函数', '@return']
  },
  'sass-at-root': {
    title: '@at-root',
    body: '<p class="lead">@at-root 将样式提升到根级别，跳出嵌套。</p><pre><code>// 基本用法\n.parent {\n  color: blue;\n  @at-root {\n    .child {\n      color: red;\n    }\n  }\n}\n\n// 编译后\n.parent { color: blue; }\n.child { color: red; }\n\n// 保持选择器\n.parent {\n  @at-root (without: all) {\n    .child { color: red; }\n  }\n}\n\n// 实用场景\n.component {\n  @at-root {\n    .dark-theme & {\n      background: #333;\n    }\n  }\n}</code></pre>',
    tags: ['@at-root', '跳出嵌套', '根级别']
  },
  'sass-warn-error': {
    title: '@warn / @error',
    body: '<p class="lead">调试和错误处理指令。</p><pre><code>// @warn - 警告信息\n@mixin deprecated($old, $new) {\n  @warn "`#{$old}` is deprecated. Use `#{$new}` instead.";\n}\n\n@include deprecated("border-radius", "rounded");\n\n// @error - 终止编译并报错\n@function require-positive($value) {\n  @if $value < 0 {\n    @error "Value must be positive, got #{$value}";\n  }\n  @return $value;\n}\n\n// @debug - 调试输出\n@debug 10px + 20px;  // 30px\n@debug type-of(10px); // number</code></pre>',
    tags: ['@warn', '@error', '@debug']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Sass 官方文档获取更多信息。</p>',
        tags: ['Sass', 'SCSS', 'CSS预处理器']
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

addLink('sass-intro', 'sass-install')
addLink('sass-install', 'sass-syntax')
addLink('sass-variables', 'sass-nesting')
addLink('sass-nesting', 'sass-parent')
addLink('sass-parent', 'sass-comments')
addLink('sass-data-types', 'sass-operators')
addLink('sass-operators', 'sass-interpolation')
addLink('sass-mixins', 'sass-include')
addLink('sass-include', 'sass-extend')
addLink('sass-extend', 'sass-placeholder')
addLink('sass-partials', 'sass-import')
addLink('sass-import', 'sass-use')
addLink('sass-use', 'sass-forward')
addLink('sass-if', 'sass-for')
addLink('sass-for', 'sass-each')
addLink('sass-each', 'sass-while')
addLink('sass-functions', 'sass-custom-functions')
addLink('sass-custom-functions', 'sass-at-root')
addLink('sass-at-root', 'sass-warn-error')

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
@import '../../fontawesome-free-6.4.0-web/fontawesome-free-6.4.0-web/css/all.min.css';
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