<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Less 知识库</h1>
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
          <h2>🍃 <span class="gradient-text">Less 完全指南</span></h2>
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
          <p>🍃 动态样式语言 | CSS 预处理器</p>
          <p>✨ 点击节点双向联动 | 变量、混合、嵌套、函数</p>
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
          <h3>🔗 Less 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Less用户'
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

// ========== Less 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'less-intro', label: 'Less 简介', hot: true },
      { id: 'less-install', label: '安装与编译', hot: true },
      { id: 'less-variables', label: '变量', hot: true },
      { id: 'less-nesting', label: '嵌套规则', hot: true }
    ]},
  { title: '🧩 基础语法', items: [
      { id: 'less-mixins', label: '混合 Mixin', hot: true },
      { id: 'less-param-mixins', label: '带参数混合', hot: true },
      { id: 'less-extend', label: '继承 @extend', hot: true },
      { id: 'less-import', label: '导入 @import', hot: true }
    ]},
  { title: '🔧 运算符与函数', items: [
      { id: 'less-operators', label: '运算符', hot: true },
      { id: 'less-builtin-functions', label: '内置函数', hot: true },
      { id: 'less-color-functions', label: '颜色函数', hot: true },
      { id: 'less-list-functions', label: '列表函数', hot: true }
    ]},
  { title: '⚙️ 高级特性', items: [
      { id: 'less-guard', label: '条件判断', hot: true },
      { id: 'less-loops', label: '循环', hot: true },
      { id: 'less-merge', label: '合并属性', hot: true },
      { id: 'less-parent', label: '父选择器 &', hot: true }
    ]},
  { title: '📦 模块与作用域', items: [
      { id: 'less-scope', label: '作用域', hot: true },
      { id: 'less-reference', label: '引用导入', hot: true },
      { id: 'less-plugin', label: '插件系统', hot: true }
    ]}
])

const selectedId = ref('less-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Less 内容映射表 ==========
const contentMap = {
  'less-intro': {
    title: 'Less 简介',
    body: '<p class="lead">Less（Leaner Style Sheets）是一门 CSS 预处理语言，扩展了 CSS 语言，增加了变量、混合、函数等特性，使 CSS 更易维护和扩展。</p><h3>核心特点</h3><ul><li><strong>变量</strong>：存储可重用的值</li><li><strong>混合</strong>：将已有样式混入到当前选择器</li><li><strong>嵌套</strong>：反映 HTML 层级结构</li><li><strong>运算</strong>：支持数学运算</li><li><strong>函数</strong>：内置颜色、数学等函数</li></ul><div class="note">💡 Less 由 Alexis Sellier 开发，受 Sass 影响，但语法更接近 CSS，学习曲线平缓。</div>',
    tags: ['CSS预处理器', 'Less', '动态样式']
  },
  'less-install': {
    title: '安装与编译',
    body: '<p class="lead">Less 可以通过 npm 安装，支持多种使用方式。</p><pre><code>// npm 安装\nnpm install -g less\n\n// 命令行编译\nlessc styles.less styles.css\nlessc --clean-css styles.less styles.min.css\nlessc --watch styles.less styles.css\n\n// 浏览器端使用\n&lt;link rel="stylesheet/less" type="text/css" href="styles.less" /&gt;\n&lt;script src="less.js"&gt;&lt;/script&gt;\n\n// Node.js 中使用\nconst less = require("less")\nless.render(".class { width: 1 + 1 }", (err, output) => {\n  console.log(output.css)\n})\n\n// 在 Vue/React 中使用\nnpm install -D less less-loader</code></pre>',
    tags: ['安装', '编译', '命令行']
  },
  'less-variables': {
    title: '变量',
    body: '<p class="lead">Less 变量以 @ 开头，用于存储可重用的值。</p><pre><code>// 定义变量\n@primary-color: #3498db;\n@font-stack: "Helvetica", sans-serif;\n@border-radius: 4px;\n@padding: 16px;\n\n// 使用变量\n.button {\n  background-color: @primary-color;\n  font-family: @font-stack;\n  border-radius: @border-radius;\n  padding: @padding;\n}\n\n// 变量插值\n@selector: .container;\n@{selector} {\n  width: 100%;\n}\n\n// 作为属性名\n@side: left;\n.element {\n  border-@{side}: 1px solid #ccc;\n}\n\n// 变量延迟加载\n@var: 0;\n.class {\n  @var: 1;\n  value: @var;  // 1\n}</code></pre>',
    tags: ['变量', '@', '插值']
  },
  'less-nesting': {
    title: '嵌套规则',
    body: '<p class="lead">嵌套反映 HTML 结构，使 CSS 更清晰。</p><pre><code>// Less 嵌套\nnav {\n  ul {\n    margin: 0;\n    li {\n      display: inline-block;\n      a {\n        text-decoration: none;\n        &:hover {\n          text-decoration: underline;\n        }\n      }\n    }\n  }\n}\n\n// 编译后 CSS\nnav ul { margin: 0; }\nnav ul li { display: inline-block; }\nnav ul li a { text-decoration: none; }\nnav ul li a:hover { text-decoration: underline; }\n\n// 父选择器 &（BEM 风格）\n.button {\n  background: blue;\n  &--large {\n    font-size: 20px;\n  }\n  &__icon {\n    margin-right: 8px;\n  }\n}</code></pre>',
    tags: ['嵌套', '父选择器', 'BEM']
  },
  'less-mixins': {
    title: '混合 Mixin',
    body: '<p class="lead">混合将已有样式混入到当前选择器。</p><pre><code>// 定义 Mixin\n.border-radius(@radius) {\n  border-radius: @radius;\n}\n\n.flex-center() {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n// 使用 Mixin\n.button {\n  .border-radius(4px);\n  .flex-center();\n}\n\n// 不输出的 Mixin（加括号）\n.hidden() {\n  display: none;\n}\n\n// 从 Mixin 中调用 Mixin\n.box-shadow(@shadow) {\n  box-shadow: @shadow;\n}\n\n.card {\n  .box-shadow(0 2px 4px rgba(0,0,0,0.1));\n}</code></pre>',
    tags: ['Mixin', '混合', '复用']
  },
  'less-param-mixins': {
    title: '带参数混合',
    body: '<p class="lead">混合可以接受参数，支持默认值。</p><pre><code>// 带参数的 Mixin\n.border-radius(@radius: 4px) {\n  border-radius: @radius;\n}\n\n// 多个参数\n.box(@width, @height: auto, @color: blue) {\n  width: @width;\n  height: @height;\n  background: @color;\n}\n\n// 使用\n.card {\n  .border-radius(8px);\n  .box(100px, 200px, red);\n}\n\n// 命名参数\n.avatar {\n  .box(@width: 50px, @color: green);\n}\n\n// 可变参数\n.box-shadow(@shadows...) {\n  box-shadow: @shadows;\n}\n\n.element {\n  .box-shadow(0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1));\n}\n\n// @arguments 变量\n.transition(@prop: all, @duration: 0.3s, @ease: ease) {\n  transition: @arguments;\n}</code></pre>',
    tags: ['参数混合', '@arguments', '默认值']
  },
  'less-extend': {
    title: '继承 @extend',
    body: '<p class="lead">@extend 让一个选择器继承另一个选择器的样式。</p><pre><code>// 基础样式\n.button-base {\n  padding: 10px 20px;\n  border: none;\n  cursor: pointer;\n}\n\n.button-primary {\n  &:extend(.button-base);\n  background: blue;\n  color: white;\n}\n\n.button-secondary {\n  &:extend(.button-base);\n  background: gray;\n}\n\n// 使用 all 关键字\n.base {\n  color: red;\n  &:hover {\n    color: darkred;\n  }\n}\n\n.extended {\n  &:extend(.base all);  // 继承所有变体\n}\n\n// 继承多个\n.element {\n  &:extend(.class1, .class2);\n}</code></pre>',
    tags: ['@extend', '继承', 'all']
  },
  'less-import': {
    title: '导入 @import',
    body: '<p class="lead">@import 用于导入其他 Less 文件。</p><pre><code>// 导入 Less 文件（可省略扩展名）\n@import "variables";\n@import "mixins";\n@import "reset";\n\n// 导入 CSS 文件\n@import (inline) "normalize.css";\n\n// 导入选项\n@import (reference) "theme";      // 只用于引用，不输出\n@import (once) "components";      // 只导入一次（默认）\n@import (multiple) "modules";     // 多次导入\n\n// 内联导入\n@import (inline) "ie-fix.css";\n\n// 可选导入\n@import (optional) "custom-theme";\n\n// 嵌套导入\n.container {\n  @import "container-theme";\n}</code></pre>',
    tags: ['@import', '导入', '模块化']
  },
  'less-operators': {
    title: '运算符',
    body: '<p class="lead">Less 支持数学运算符。</p><pre><code>// 数学运算\n@width: 100px;\n.container {\n  width: @width / 2;        // 50px\n  padding: 10px + 5px;      // 15px\n  margin: 20px - 5px;       // 15px\n  transform: rotate(15deg * 2); // 30deg\n}\n\n// 颜色运算\n@color: #ff0000;\n.darken {\n  color: @color + #333333;  // #ff3333\n}\n\n// 变量运算\n@base: 10px;\n@double: @base * 2;\n@triple: @double + @base;\n\n// 除法需要括号\n@ratio: (16px / 2);\n\n// 比较运算（用于守卫）\n@if (@width > 50px) {\n  .large { font-size: 20px; }\n}</code></pre>',
    tags: ['运算符', '数学运算', '颜色运算']
  },
  'less-builtin-functions': {
    title: '内置函数',
    body: '<p class="lead">Less 提供丰富的内置函数。</p><pre><code>// 字符串函数\n@str: "Hello World";\n.str {\n  content: escape(@str);      // URL 编码\n  length: length(@str);        // 字符串长度\n  replace: replace(@str, "World", "Less");\n}\n\n// 数学函数\n.math {\n  width: ceil(10.2px);     // 11px\n  height: floor(10.8px);   // 10px\n  margin: round(10.5px);   // 11px\n  opacity: percentage(0.5); // 50%\n}\n\n// 类型函数\n@value: 16px;\n.type {\n  is-number: isnumber(@value);   // true\n  is-color: iscolor(@value);     // false\n  is-pixel: ispixel(@value);     // true\n}\n\n// 单位转换\n.convert {\n  width: convert(1in, mm);       // 25.4mm\n}</code></pre>',
    tags: ['函数', '数学函数', '字符串']
  },
  'less-color-functions': {
    title: '颜色函数',
    body: '<p class="lead">Less 提供强大的颜色处理函数。</p><pre><code>@color: #3498db;\n\n// 颜色调整\n.light {\n  background: lighten(@color, 20%);\n  color: darken(@color, 20%);\n  border: saturate(@color, 50%);\n  box-shadow: desaturate(@color, 30%);\n}\n\n// 颜色混合\n.mix {\n  color: mix(@color, #e74c3c, 50%);\n}\n\n// 透明度\n.alpha {\n  color: fade(@color, 50%);      // 50% 透明度\n  background: fadeout(@color, 20%); // 减少 20% 透明度\n}\n\n// 颜色提取\n.extract {\n  red: red(@color);        // 52\n  green: green(@color);    // 152\n  blue: blue(@color);      // 219\n  hue: hue(@color);        // 204deg\n  saturation: saturation(@color); // 70%\n  lightness: lightness(@color);   // 53%\n}\n\n// 颜色对比\n.contrast {\n  color: contrast(@color, #000, #fff, 43%);\n}</code></pre>',
    tags: ['颜色函数', 'lighten', 'darken', 'mix']
  },
  'less-list-functions': {
    title: '列表函数',
    body: '<p class="lead">Less 支持列表（数组）操作函数。</p><pre><code>// 定义列表\n@sizes: 10px, 20px, 30px;\n@colors: red, green, blue;\n\n// 列表操作\n.first {\n  padding: extract(@sizes, 1);   // 10px\n  length: length(@sizes);         // 3\n}\n\n// 范围函数\n.range {\n  @list: range(1, 5);             // 1,2,3,4,5\n  @even: range(2, 10, 2);         // 2,4,6,8,10\n}\n\n// 循环列表\n.each-loop(@list, @index: 1) when (@index <= length(@list)) {\n  .item-@{index} {\n    value: extract(@list, @index);\n  }\n  .each-loop(@list, (@index + 1));\n}\n\n.colors {\n  .each-loop(@colors);\n}</code></pre>',
    tags: ['列表函数', 'extract', 'length', 'range']
  },
  'less-guard': {
    title: '条件判断',
    body: '<p class="lead">Less 使用守卫（when）实现条件判断。</p><pre><code>// Mixin 守卫\n.bg(@color) when (lightness(@color) >= 50%) {\n  background: @color;\n  color: #000;\n}\n\n.bg(@color) when (lightness(@color) < 50%) {\n  background: @color;\n  color: #fff;\n}\n\n// 使用\n.element {\n  .bg(#3498db);  // 根据颜色亮度选择\n}\n\n// 多个条件\n.size(@width, @height) when (@width > 100) and (@height > 100) {\n  font-size: 20px;\n}\n\n// 使用类型守卫\n.mixin(@value) when (isnumber(@value)) {\n  width: @value;\n}\n\n.mixin(@value) when (iscolor(@value)) {\n  color: @value;\n}\n\n// 默认守卫\n.default(@value) when (default()) {\n  content: "默认";\n}</code></pre>',
    tags: ['守卫', 'when', '条件判断']
  },
  'less-loops': {
    title: '循环',
    body: '<p class="lead">Less 通过递归实现循环。</p><pre><code>// 基本循环\n.loop(@counter) when (@counter > 0) {\n  .loop((@counter - 1));\n  .item-@{counter} {\n    width: @counter * 10px;\n  }\n}\n\n.loop(5);\n\n// 生成网格\n@columns: 12;\n.grid-loop(@i) when (@i <= @columns) {\n  .col-@{i} {\n    width: (100% / @columns) * @i;\n  }\n  .grid-loop(@i + 1);\n}\n\n.grid-loop(1);\n\n// 遍历列表\n@colors: red, green, blue;\n.color-loop(@index) when (@index <= length(@colors)) {\n  @color: extract(@colors, @index);\n  .btn-@{color} {\n    background: @color;\n  }\n  .color-loop(@index + 1);\n}\n\n.color-loop(1);</code></pre>',
    tags: ['循环', '递归', '生成']
  },
  'less-merge': {
    title: '合并属性',
    body: '<p class="lead">Less 支持合并多个相同属性的值。</p><pre><code>// 合并属性（逗号分隔）\n.shadow() {\n  box-shadow+: 0 1px 2px rgba(0,0,0,0.1);\n}\n\n.card {\n  .shadow();\n  box-shadow+: 0 2px 4px rgba(0,0,0,0.1);\n}\n\n// 编译后\n.card {\n  box-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1);\n}\n\n// 合并属性（空格分隔）\n.transform() {\n  transform+_: scale(1);\n}\n\n.element {\n  .transform();\n  transform+_: rotate(10deg);\n}\n\n// 编译后\n.element {\n  transform: scale(1) rotate(10deg);\n}</code></pre>',
    tags: ['属性合并', '+', '+_']
  },
  'less-parent': {
    title: '父选择器 &',
    body: '<p class="lead">父选择器 & 表示嵌套的外层选择器。</p><pre><code>// 基本用法\n.button {\n  background: blue;\n  &:hover {\n    background: darkblue;\n  }\n  &--large {\n    font-size: 20px;\n  }\n}\n\n// 组合选择器\n.parent {\n  & > &__child {\n    color: red;\n  }\n}\n\n// 多层 &\n.main {\n  & &-title {\n    font-weight: bold;\n  }\n}\n\n// 改变顺序\n.component {\n  .dark-theme & {\n    color: white;\n  }\n}\n\n// 生成多个组合\n.link {\n  & + & {\n    margin-left: 10px;\n  }\n  &,\n  &:visited {\n    color: blue;\n  }\n}</code></pre>',
    tags: ['父选择器', '&', '嵌套']
  },
  'less-scope': {
    title: '作用域',
    body: '<p class="lead">Less 中的变量作用域规则。</p><pre><code>// 变量提升\n@var: 0;\n.class1 {\n  @var: 1;\n  .class2 {\n    @var: 2;\n    value: @var;  // 2\n  }\n  value: @var;    // 1\n}\n\n// 混合作用域\n.mixin() {\n  @width: 100%;\n}\n\n.container {\n  .mixin();\n  width: @width;  // 100%（mixin 中定义的变量可用）\n}\n\n// 导入作用域\n@import "variables.less";  // 全局可用\n\n// 懒加载\n@var: 0;\n.class {\n  @var: 1;\n  value: @var;  // 1\n}\n@var: 2;  // 不影响上面</code></pre>',
    tags: ['作用域', '变量提升', '懒加载']
  },
  'less-reference': {
    title: '引用导入',
    body: '<p class="lead">使用 reference 关键字只引用不输出。</p><pre><code>// 引用导入（只用于引用，不输出 CSS）\n@import (reference) "bootstrap.less";\n\n// 只使用 mixin，不输出类\n.button {\n  .btn();  // 只使用 mixin\n}\n\n// 使用 @import (reference) 减少输出\n@import (reference) "theme.less";\n\n.card {\n  .card-base();  // 只使用 mixin\n}\n\n// 结合 @import (once)\n@import (reference, once) "utils.less";\n\n// 内联导入（不处理，直接输出）\n@import (inline) "ie-fix.css";</code></pre>',
    tags: ['引用导入', 'reference', '内联']
  },
  'less-plugin': {
    title: '插件系统',
    body: '<p class="lead">Less 支持插件扩展功能。</p><pre><code>// 安装插件\nnpm install -g less-plugin-clean-css\nnpm install -g less-plugin-autoprefix\n\n// 使用插件\nlessc --clean-css styles.less styles.min.css\nlessc --autoprefix="last 2 versions" styles.less styles.css\n\n// 自定义插件示例\n// my-plugin.js\nmodule.exports = {\n  install: function(less, pluginManager) {\n    pluginManager.addVisitor({\n      visitRule: function(rule) {\n        // 处理规则\n        return rule;\n      }\n    });\n  }\n};\n\n// 使用自定义插件\nlessc --plugin=my-plugin styles.less styles.css\n\n// 常用插件\n// - clean-css: CSS 压缩\n// - autoprefix: 自动添加浏览器前缀\n// - import-once: 只导入一次</code></pre>',
    tags: ['插件', 'clean-css', 'autoprefix']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Less 官方文档获取更多信息。</p>',
        tags: ['Less', 'CSS预处理器']
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

addLink('less-intro', 'less-install')
addLink('less-install', 'less-variables')
addLink('less-variables', 'less-nesting')
addLink('less-mixins', 'less-param-mixins')
addLink('less-param-mixins', 'less-extend')
addLink('less-extend', 'less-import')
addLink('less-operators', 'less-builtin-functions')
addLink('less-builtin-functions', 'less-color-functions')
addLink('less-color-functions', 'less-list-functions')
addLink('less-guard', 'less-loops')
addLink('less-loops', 'less-merge')
addLink('less-merge', 'less-parent')
addLink('less-scope', 'less-reference')
addLink('less-reference', 'less-plugin')

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