<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">JS 模块化知识库</h1>
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
          <h2>📦 <span class="gradient-text">JS 模块化完全指南</span></h2>
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
          <p>📦 JavaScript 模块化发展史 | 从无到有</p>
          <p>✨ 点击节点双向联动 | 掌握模块化精髓</p>
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
          <h3>🔗 JS 模块化知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'JS开发者'
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

// ========== JS 模块化导航数据 ==========
const navSections = ref([
  { title: '📖 模块化概述', items: [
      { id: 'mod-intro', label: '模块化简介', hot: true },
      { id: 'mod-history', label: '发展历史', hot: true },
      { id: 'mod-benefits', label: '模块化优势', hot: true }
    ]},
  { title: '🏛️ 早期模式', items: [
      { id: 'mod-global', label: '全局函数模式', hot: true },
      { id: 'mod-namespace', label: '命名空间模式', hot: true },
      { id: 'mod-iife', label: 'IIFE 模式', hot: true }
    ]},
  { title: '📦 CommonJS', items: [
      { id: 'cjs-intro', label: 'CommonJS 简介', hot: true },
      { id: 'cjs-require', label: 'require 导入', hot: true },
      { id: 'cjs-exports', label: 'module.exports', hot: true },
      { id: 'cjs-loading', label: '模块加载机制', hot: true },
      { id: 'cjs-cache', label: '模块缓存', hot: true }
    ]},
  { title: '🔄 AMD', items: [
      { id: 'amd-intro', label: 'AMD 简介', hot: true },
      { id: 'amd-define', label: 'define 定义', hot: true },
      { id: 'amd-require', label: 'require 加载', hot: true },
      { id: 'amd-config', label: '配置与 shim', hot: true }
    ]},
  { title: '✨ ES Module', items: [
      { id: 'esm-intro', label: 'ES Module 简介', hot: true },
      { id: 'esm-export', label: 'export 导出', hot: true },
      { id: 'esm-import', label: 'import 导入', hot: true },
      { id: 'esm-default', label: '默认导出/导入', hot: true },
      { id: 'esm-dynamic', label: '动态导入 import()', hot: true },
      { id: 'esm-top-await', label: '顶层 await', hot: true }
    ]},
  { title: '🔧 模块打包工具', items: [
      { id: 'webpack-intro', label: 'Webpack', hot: true },
      { id: 'vite-intro', label: 'Vite', hot: true },
      { id: 'rollup-intro', label: 'Rollup', hot: true },
      { id: 'esbuild-intro', label: 'esbuild', hot: true }
    ]},
  { title: '🔄 模块对比与互操作', items: [
      { id: 'cjs-vs-esm', label: 'CommonJS vs ESM', hot: true },
      { id: 'amd-vs-cjs', label: 'AMD vs CommonJS', hot: true },
      { id: 'interop', label: '模块互操作', hot: true }
    ]}
])

const selectedId = ref('mod-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== JS 模块化内容映射表 ==========
const contentMap = {
  'mod-intro': {
    title: '模块化简介',
    body: '<p class="lead">模块化是将复杂系统拆分为独立、可复用的模块，每个模块负责特定功能，通过明确的接口进行通信。</p><h3>什么是模块化？</h3><ul><li><strong>模块</strong>：独立的代码单元，封装特定功能</li><li><strong>依赖管理</strong>：声明模块间的依赖关系</li><li><strong>接口</strong>：模块对外暴露的功能</li><li><strong>隔离</strong>：模块内部变量不污染全局</li></ul><div class="note">💡 JavaScript 模块化经历了从无到有、从社区规范到语言标准的发展历程。</div>',
    tags: ['模块化', '代码组织', '依赖管理']
  },
  'mod-history': {
    title: '发展历史',
    body: '<p class="lead">JavaScript 模块化的发展历程。</p><table class="mdn-table"><thead><tr><th>时期</th><th>方案</th><th>特点</th></tr></thead><tbody><tr><td>早期</th><td>全局函数/对象</th><td>简单但污染全局，无依赖管理</tr><tr><td>2009-2010</th><td>IIFE + 闭包</th><td>隔离作用域，但依赖管理困难</tr><tr><td>2009</th><td>CommonJS</th><td>同步加载，服务端为主</tr><tr><td>2011</th><td>AMD</th><td>异步加载，浏览器为主</tr><tr><td>2015</th><td>ES Module</th><td>语言标准，静态分析，原生支持</tr></tbody></table>',
    tags: ['历史', '演进', 'ES6']
  },
  'mod-benefits': {
    title: '模块化优势',
    body: '<p class="lead">模块化开发带来的好处。</p><ul><li><strong>命名空间隔离</strong>：避免全局变量污染</li><li><strong>依赖管理</strong>：明确声明依赖关系</li><li><strong>代码复用</strong>：模块可在多个地方使用</li><li><strong>可维护性</strong>：模块职责单一，易于维护</li><li><strong>按需加载</strong>：只加载需要的模块</li><li><strong>便于测试</strong>：模块可独立测试</li><li><strong>协作开发</strong>：多人可并行开发不同模块</li></ul>',
    tags: ['优势', '可维护性', '代码复用']
  },
  'mod-global': {
    title: '全局函数模式',
    body: '<p class="lead">将不同功能封装为全局函数，是最原始的模块化方式。</p><pre><code>// 定义全局函数\nfunction add(a, b) {\n  return a + b\n}\n\nfunction multiply(a, b) {\n  return a * b\n}\n\n// 使用\nconsole.log(add(2, 3))  // 5\nconsole.log(multiply(2, 3))  // 6\n\n// 问题\n// 1. 全局变量污染\n// 2. 命名冲突风险\n// 3. 无依赖管理</code></pre>',
    tags: ['全局函数', '早期模式', '污染']
  },
  'mod-namespace': {
    title: '命名空间模式',
    body: '<p class="lead">使用对象作为命名空间，减少全局变量数量。</p><pre><code>// 定义命名空间\nvar MyApp = {\n  utils: {\n    add: function(a, b) { return a + b },\n    multiply: function(a, b) { return a * b }\n  },\n  math: {\n    PI: 3.14159,\n    circleArea: function(r) { return this.PI * r * r }\n  }\n}\n\n// 使用\nMyApp.utils.add(2, 3)\nMyApp.math.circleArea(5)\n\n// 缺点\n// 1. 内部状态可被外部修改\n// 2. 依赖关系不明确</code></pre>',
    tags: ['命名空间', '对象', '模块化']
  },
  'mod-iife': {
    title: 'IIFE 模式',
    body: '<p class="lead">使用立即执行函数表达式创建私有作用域。</p><pre><code>// IIFE 模块\nvar Module = (function() {\n  // 私有变量\n  var privateVar = "private"\n  \n  // 私有函数\n  function privateMethod() {\n    return "private method"\n  }\n  \n  // 公开 API\n  return {\n    publicVar: "public",\n    publicMethod: function() {\n      return privateVar + " " + privateMethod()\n    }\n  }\n})()\n\n// 使用\nconsole.log(Module.publicVar)\nconsole.log(Module.publicMethod())\n\n// 优点：私有作用域\n// 缺点：依赖管理仍需要手动</code></pre>',
    tags: ['IIFE', '闭包', '私有作用域']
  },
  'cjs-intro': {
    title: 'CommonJS 简介',
    body: '<p class="lead">CommonJS 是 Node.js 采用的模块规范，使用同步加载，适合服务端。</p><h3>核心特点</h3><ul><li><strong>同步加载</strong>：模块加载是同步的</li><li><strong>值拷贝</strong>：导出的是值的拷贝</li><li><strong>动态模块</strong>：require 可在运行时调用</li><li><strong>缓存机制</strong>：模块首次加载后缓存</li></ul><div class="note">💡 CommonJS 规范使 JavaScript 能够在服务端环境中模块化开发。</div>',
    tags: ['CommonJS', 'Node.js', '同步']
  },
  'cjs-require': {
    title: 'require 导入',
    body: '<p class="lead">require 函数用于导入其他模块。</p><pre><code>// 导入核心模块\nconst fs = require("fs")\nconst path = require("path")\n\n// 导入第三方模块\nconst express = require("express")\nconst lodash = require("lodash")\n\n// 导入自定义模块\nconst myModule = require("./my-module")\nconst utils = require("../utils")\n\n// 导入 JSON 文件\nconst config = require("./config.json")\n\n// require 返回的是 module.exports\nconsole.log(typeof require)  // "function"\n\n// require 保证相同模块只加载一次\nconst a = require("./counter")\nconst b = require("./counter")\nconsole.log(a === b)  // true</code></pre>',
    tags: ['require', '导入', '模块加载']
  },
  'cjs-exports': {
    title: 'module.exports',
    body: '<p class="lead">module.exports 是 CommonJS 模块的导出对象。</p><pre><code>// math.js - 导出单个函数\nmodule.exports = function add(a, b) {\n  return a + b\n}\n\n// 导出对象\nmodule.exports = {\n  add: (a, b) =&gt; a + b,\n  subtract: (a, b) =&gt; a - b\n}\n\n// exports 是 module.exports 的引用\nexports.name = "Alice"\nexports.age = 25\n\n// 不能重新赋值 exports\nexports = { name: "Bob" }  // 错误！会断开引用</code></pre>',
    tags: ['module.exports', '导出', 'exports']
  },
  'cjs-loading': {
    title: '模块加载机制',
    body: '<p class="lead">CommonJS 模块的加载和执行流程。</p><pre><code>// 模块加载流程\n// 1. 路径解析\n// 2. 检查缓存\n// 3. 创建 Module 实例\n// 4. 读取文件内容\n// 5. 包装代码\n// 6. 执行模块代码\n// 7. 返回 module.exports\n\n// 包装后的模块代码\n// (function(exports, require, module, __filename, __dirname) {\n//   // 模块代码\n// })\n\n// 模块内的可用变量\nconsole.log(__filename)  // 当前文件的绝对路径\nconsole.log(__dirname)   // 当前文件所在目录</code></pre>',
    tags: ['加载流程', '包装函数', '__filename']
  },
  'cjs-cache': {
    title: '模块缓存',
    body: '<p class="lead">require.cache 存储已加载的模块，避免重复加载。</p><pre><code>// 查看缓存\nconsole.log(require.cache)\n\n// 模块被缓存后，第二次 require 返回缓存中的对象\nconst a = require("./module")\nconst b = require("./module")\nconsole.log(a === b)  // true\n\n// 删除缓存\nconst modulePath = require.resolve("./my-module")\ndelete require.cache[modulePath]\n\n// 重新加载模块\nconst freshModule = require("./my-module")</code></pre>',
    tags: ['缓存', 'require.cache', '模块缓存']
  },
  'amd-intro': {
    title: 'AMD 简介',
    body: '<p class="lead">AMD（Asynchronous Module Definition）是浏览器端的异步模块规范，RequireJS 是其最著名的实现。</p><h3>核心特点</h3><ul><li><strong>异步加载</strong>：模块和依赖异步加载，不阻塞页面</li><li><strong>依赖前置</strong>：声明依赖后自动加载</li><li><strong>浏览器优化</strong>：支持合并打包</li><li><strong>兼容性好</strong>：支持非 AMD 模块的 shim 封装</li></ul><div class="note">💡 AMD 规范解决了浏览器环境中模块异步加载的问题。</div>',
    tags: ['AMD', 'RequireJS', '异步']
  },
  'amd-define': {
    title: 'define 定义',
    body: '<p class="lead">define 函数用于定义 AMD 模块。</p><pre><code>// 无依赖模块\ndefine(function() {\n  return {\n    add: function(a, b) { return a + b }\n  }\n})\n\n// 有依赖模块\ndefine(["jquery", "underscore"], function($, _) {\n  return {\n    init: function() { console.log("初始化") }\n  }\n})\n\n// 导出多个值\ndefine(["dependency"], function(dep) {\n  var privateVar = "private"\n  \n  function publicMethod() {\n    return privateVar\n  }\n  \n  return {\n    publicMethod: publicMethod,\n    version: "1.0.0"\n  }\n})</code></pre>',
    tags: ['define', '模块定义', 'AMD']
  },
  'amd-require': {
    title: 'require 加载',
    body: '<p class="lead">require 函数用于在运行时加载 AMD 模块。</p><pre><code>// 基本用法\nrequire(["module1", "module2"], function(mod1, mod2) {\n  mod1.doSomething()\n  mod2.doSomething()\n})\n\n// 错误处理\nrequire(["module"], function(mod) {\n  // 成功回调\n}, function(err) {\n  console.error("模块加载失败:", err.requireModules)\n})\n\n// 动态加载\nfunction loadPlugin(pluginName) {\n  require([pluginName], function(plugin) {\n    plugin.init()\n  })\n}</code></pre>',
    tags: ['require', '模块加载', 'AMD']
  },
  'amd-config': {
    title: '配置与 shim',
    body: '<p class="lead">通过 require.config 配置模块加载器。</p><pre><code>require.config({\n  baseUrl: "js",\n  paths: {\n    "jquery": "lib/jquery",\n    "underscore": "lib/underscore"\n  },\n  shim: {\n    "backbone": {\n      deps: ["underscore", "jquery"],\n      exports: "Backbone"\n    }\n  }\n})</code></pre>',
    tags: ['配置', 'shim', 'RequireJS']
  },
  'esm-intro': {
    title: 'ES Module 简介',
    body: '<p class="lead">ES Module 是 JavaScript 官方标准化的模块系统，于 ES6（ES2015）正式引入。</p><h3>核心特点</h3><ul><li><strong>静态结构</strong>：导入导出关系在编译时确定</li><li><strong>异步加载</strong>：默认异步加载</li><li><strong>严格模式</strong>：模块代码自动处于严格模式</li><li><strong>值的引用</strong>：导出的是值的引用，而非拷贝</li><li><strong>Tree Shaking</strong>：支持静态分析，实现摇树优化</li></ul><div class="note">💡 ES Module 已被所有现代浏览器和 Node.js 原生支持。</div>',
    tags: ['ES Module', '官方标准', 'ES6']
  },
  'esm-export': {
    title: 'export 导出',
    body: '<p class="lead">export 语句用于从模块中导出函数、对象、变量等。</p><pre><code>// 导出单个声明\nexport const name = "Alice"\nexport function greet() { return "Hello" }\n\n// 导出列表\nconst version = "1.0.0"\nconst author = "Bob"\nexport { version, author }\n\n// 重命名导出\nconst firstName = "John"\nexport { firstName as first }\n\n// 导出默认值\nexport default function() {\n  console.log("Default export")\n}\n\nexport default 42</code></pre>',
    tags: ['export', '导出', 'ES Module']
  },
  'esm-import': {
    title: 'import 导入',
    body: '<p class="lead">import 语句用于导入其他模块导出的内容。</p><pre><code>// 导入命名导出\nimport { name, greet } from "./module.js"\n\n// 导入所有命名导出\nimport * as myModule from "./module.js"\n\n// 导入默认导出\nimport defaultExport from "./module.js"\n\n// 同时导入默认和命名导出\nimport defaultExport, { named1 } from "./module.js"\n\n// 重命名导入\nimport { longName as short } from "./module.js"\n\n// 仅执行模块\nimport "./side-effects.js"</code></pre>',
    tags: ['import', '导入', 'ES Module']
  },
  'esm-default': {
    title: '默认导出/导入',
    body: '<p class="lead">默认导出是每个模块特有的主要导出方式，导入时可以自定义名称。</p><pre><code>// math.js - 默认导出\nexport default function add(a, b) {\n  return a + b\n}\n\n// 也可以先定义后导出\nconst subtract = (a, b) =&gt; a - b\nexport default subtract\n\n// 导入默认导出（名称可以任意）\nimport addFunction from "./math.js"\nimport myMath from "./math.js"\n\n// 混合使用\nexport default class Calculator {}\nexport const VERSION = "1.0.0"\n\n// 导入混合\nexport Calculator, { VERSION } from "./calculator.js"</code></pre>',
    tags: ['默认导出', '默认导入', 'export default']
  },
  'esm-dynamic': {
    title: '动态导入 import()',
    body: '<p class="lead">import() 函数允许在运行时动态加载模块，返回 Promise。</p><pre><code>// 动态导入语法\nimport("./module.js").then(module => {\n  module.doSomething()\n})\n\n// 使用 async/await\nasync function loadModule() {\n  const module = await import("./module.js")\n  module.doSomething()\n}\n\n// 条件加载\nif (user.isAdmin) {\n  const adminModule = await import("./admin.js")\n  adminModule.init()\n}\n\n// 按需加载\nbutton.addEventListener("click", async () => {\n  const dialog = await import("./dialog.js")\n  dialog.show()\n})</code></pre>',
    tags: ['动态导入', 'import()', '代码分割']
  },
  'esm-top-await': {
    title: '顶层 await',
    body: '<p class="lead">顶层 await 允许在模块顶层使用 await，无需 async 函数包裹。</p><pre><code>// data.js\nconst response = await fetch("/api/data")\nconst data = await response.json()\nexport default data\n\n// 使用模块\nimport data from "./data.js"\nconsole.log(data)\n\n// 动态加载\nconst module = await import("./module.js")\n\n// 多个顶层 await（并行）\nconst [user, posts] = await Promise.all([\n  fetch("/api/user").then(r =&gt; r.json()),\n  fetch("/api/posts").then(r =&gt; r.json())\n])</code></pre>',
    tags: ['顶层await', '异步', 'ES2022']
  },
  'webpack-intro': {
    title: 'Webpack',
    body: '<p class="lead">Webpack 是最流行的模块打包工具，将各种资源打包为浏览器可执行的文件。</p><pre><code>// webpack.config.js\nmodule.exports = {\n  entry: "./src/index.js",\n  output: {\n    path: path.resolve(__dirname, "dist"),\n    filename: "bundle.js"\n  },\n  module: {\n    rules: [\n      { test: /\\.css$/, use: ["style-loader", "css-loader"] },\n      { test: /\\.js$/, use: "babel-loader" }\n    ]\n  },\n  plugins: [new HtmlWebpackPlugin()]\n}</code></pre>',
    tags: ['Webpack', '打包工具', '构建']
  },
  'vite-intro': {
    title: 'Vite',
    body: '<p class="lead">Vite 是新一代前端构建工具，利用原生 ES Module 提供极快的开发体验。</p><pre><code>// vite.config.js\nimport { defineConfig } from "vite"\nimport vue from "@vitejs/plugin-vue"\n\nexport default defineConfig({\n  plugins: [vue()],\n  server: {\n    port: 3000,\n    proxy: {\n      "/api": "http://localhost:8080"\n    }\n  },\n  build: {\n    outDir: "dist",\n    sourcemap: true\n  }\n})</code></pre>',
    tags: ['Vite', 'ES Module', '快速构建']
  },
  'rollup-intro': {
    title: 'Rollup',
    body: '<p class="lead">Rollup 专注于 JavaScript 库的打包，以 Tree Shaking 能力著称。</p><pre><code>// rollup.config.js\nexport default {\n  input: "src/index.js",\n  output: {\n    file: "dist/bundle.js",\n    format: "esm"\n  },\n  plugins: [resolve(), commonjs(), terser()]\n}</code></pre>',
    tags: ['Rollup', 'Tree Shaking', '库打包']
  },
  'esbuild-intro': {
    title: 'esbuild',
    body: '<p class="lead">esbuild 是用 Go 语言编写的极速打包工具，性能卓越。</p><pre><code>// build.js\nrequire("esbuild").build({\n  entryPoints: ["src/index.js"],\n  bundle: true,\n  outfile: "dist/bundle.js",\n  minify: true,\n  platform: "browser",\n  target: ["es2015"]\n})</code></pre>',
    tags: ['esbuild', '高性能', '极速']
  },
  'cjs-vs-esm': {
    title: 'CommonJS vs ESM',
    body: '<p class="lead">CommonJS 和 ES Module 的主要区别。</p><table class="mdn-table"><thead><tr><th>特性</th><th>CommonJS</th><th>ES Module</th></tr></thead><tbody><tr><td>加载时机</th><td>运行时</th><td>编译时</tr><tr><td>加载方式</th><td>同步</th><td>异步</tr><tr><td>语法</th><td>require/module.exports</th><td>import/export</tr><tr><td>值绑定</th><td>值的拷贝</th><td>值的引用（只读）</tr><tr><td>静态分析</th><td>不支持</th><td>支持</tr><tr><td>Tree Shaking</th><td>不支持</th><td>支持</tr></tbody></table><pre><code>// CommonJS\nlet count = 0\nmodule.exports.increment = () =&gt; ++count\n\n// ES Module\nexport let count = 0\nexport function increment() { count++ }</code></pre>',
    tags: ['CommonJS', 'ES Module', '对比']
  },
  'amd-vs-cjs': {
    title: 'AMD vs CommonJS',
    body: '<p class="lead">AMD 和 CommonJS 的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>AMD</th><th>CommonJS</th></tr></thead><tbody><tr><td>设计目标</th><td>浏览器端</th><td>服务端</tr><tr><td>加载方式</th><td>异步</th><td>同步</tr><tr><td>语法</th><td>define/require</th><td>require/module.exports</tr><tr><td>依赖声明</th><td>依赖前置</th><td>就近 require</tr></tbody><tr><pre><code>// AMD\ndefine(["a", "b"], function(a, b) {\n  return { result: true }\n})\n\n// CommonJS\nvar a = require("a")\nvar b = require("b")\nmodule.exports = { result: true }</code></pre>',
    tags: ['AMD', 'CommonJS', '对比']
  },
  interop: {
    title: '模块互操作',
    body: '<p class="lead">不同模块系统之间的互操作。</p><pre><code>// ESM 中导入 CommonJS\nimport cjsModule from "cjs-package"\nimport { createRequire } from "module"\nconst require = createRequire(import.meta.url)\nconst lodash = require("lodash")\n\n// CommonJS 中导入 ESM\nasync function loadESM() {\n  const esmModule = await import("esm-package")\n  return esmModule\n}\n\n// package.json 条件导出\n{\n  "exports": {\n    "require": "./index.cjs",\n    "import": "./index.mjs"\n  }\n}</code></pre>',
    tags: ['互操作', '兼容', '混合使用']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 JavaScript 模块化相关文档获取更多信息。</p>',
        tags: ['模块化', 'JavaScript']
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

addLink('mod-intro', 'mod-history')
addLink('mod-history', 'mod-benefits')
addLink('mod-global', 'mod-namespace')
addLink('mod-namespace', 'mod-iife')
addLink('cjs-intro', 'cjs-require')
addLink('cjs-require', 'cjs-exports')
addLink('cjs-exports', 'cjs-loading')
addLink('cjs-loading', 'cjs-cache')
addLink('amd-intro', 'amd-define')
addLink('amd-define', 'amd-require')
addLink('amd-require', 'amd-config')
addLink('esm-intro', 'esm-export')
addLink('esm-export', 'esm-import')
addLink('esm-import', 'esm-default')
addLink('esm-default', 'esm-dynamic')
addLink('esm-dynamic', 'esm-top-await')
addLink('webpack-intro', 'vite-intro')
addLink('vite-intro', 'rollup-intro')
addLink('rollup-intro', 'esbuild-intro')
addLink('cjs-vs-esm', 'amd-vs-cjs')
addLink('amd-vs-cjs', 'interop')

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