<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">ES Module 知识库</h1>
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
          <h2>📦 <span class="gradient-text">ES Module 完全指南</span></h2>
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
          <p>📦 JavaScript 官方模块标准 | 现代前端基石</p>
          <p>✨ 点击节点双向联动 | import/export 语法</p>
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
          <h3>🔗 ES Module 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'ESM开发者'
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

// ========== ES Module 导航数据 ==========
const navSections = ref([
  { title: '📖 基础入门', items: [
      { id: 'esm-intro', label: 'ES Module 简介', hot: true },
      { id: 'esm-export', label: 'export 导出', hot: true },
      { id: 'esm-import', label: 'import 导入', hot: true },
      { id: 'esm-default', label: '默认导出与导入', hot: true }
    ]},
  { title: '📦 高级导出', items: [
      { id: 'esm-named', label: '命名导出', hot: true },
      { id: 'esm-rename', label: '重命名导入导出', hot: true },
      { id: 'esm-aggregate', label: '聚合导出', hot: true },
      { id: 'esm-dynamic', label: '动态导入 import()', hot: true }
    ]},
  { title: '⚙️ 配置与使用', items: [
      { id: 'esm-script-tag', label: 'script 标签使用', hot: true },
      { id: 'esm-nodejs', label: 'Node.js 中使用', hot: true },
      { id: 'esm-package-json', label: 'package.json 配置', hot: true },
      { id: 'esm-import-meta', label: 'import.meta', hot: true }
    ]},
  { title: '🔄 与其他模块系统', items: [
      { id: 'esm-vs-cjs', label: 'ESM vs CommonJS', hot: true },
      { id: 'esm-vs-amd', label: 'ESM vs AMD', hot: true },
      { id: 'esm-interop', label: '与 CJS 互操作', hot: true }
    ]},
  { title: '🎯 高级特性', items: [
      { id: 'esm-top-level-await', label: '顶层 await', hot: true },
      { id: 'esm-import-assert', label: '导入断言', hot: true },
      { id: 'esm-import-meta-resolve', label: 'import.meta.resolve', hot: true }
    ]}
])

const selectedId = ref('esm-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== ES Module 内容映射表 ==========
const contentMap = {
  'esm-intro': {
    title: 'ES Module 简介',
    body: '<p class="lead">ES Module（ECMAScript Module）是 JavaScript 官方标准化的模块系统，于 ES6（ES2015）正式引入，是现代前端开发的标准模块化方案。</p><h3>核心特点</h3><ul><li><strong>静态结构</strong>：导入导出关系在编译时确定</li><li><strong>异步加载</strong>：默认异步加载，适合浏览器环境</li><li><strong>严格模式</strong>：模块代码自动处于严格模式</li><li><strong>值的引用</strong>：导出的是值的引用，而非拷贝</li><li><strong>Tree Shaking</strong>：支持静态分析，实现摇树优化</li></ul><div class="note">💡 ES Module 由 ECMAScript 2015 规范定义，现已被所有现代浏览器和 Node.js 原生支持。</div>',
    tags: ['ES模块', '官方标准', 'ES6']
  },
  'esm-export': {
    title: 'export 导出',
    body: '<p class="lead">export 语句用于从模块中导出函数、对象、变量等。</p><pre><code>// 导出单个声明\nexport const name = "Alice"\nexport function greet() {\n  return "Hello"\n}\nexport class Person {}\n\n// 导出列表\nconst version = "1.0.0"\nconst author = "Bob"\nexport { version, author }\n\n// 重命名导出\nconst firstName = "John"\nexport { firstName as first }\n\n// 导出默认值（每个模块只能有一个）\nexport default function() {\n  console.log("Default export")\n}\n\n// 默认导出值\nexport default 42\nexport default { id: 1, name: "Alice" }\n\n// 同时使用命名导出和默认导出\nexport const PI = 3.14159\nexport default function calculate() {}</code></pre>',
    tags: ['export', '导出', '模块导出']
  },
  'esm-import': {
    title: 'import 导入',
    body: '<p class="lead">import 语句用于导入其他模块导出的内容。</p><pre><code>// 导入命名导出\nimport { name, greet, Person } from "./module.js"\n\n// 导入所有命名导出（使用命名空间）\nimport * as myModule from "./module.js"\nconsole.log(myModule.name)\nconsole.log(myModule.greet())\n\n// 导入默认导出\nimport defaultExport from "./module.js"\n\n// 同时导入默认和命名导出\nimport defaultExport, { named1, named2 } from "./module.js"\n\n// 重命名导入\nimport { longName as short } from "./module.js"\n\n// 仅执行模块（不导入任何值）\nimport "./side-effects.js"\n\n// 导入 JSON（需要相应配置）\nimport data from "./data.json" assert { type: "json" }</code></pre>',
    tags: ['import', '导入', '模块导入']
  },
  'esm-default': {
    title: '默认导出与导入',
    body: '<p class="lead">默认导出是每个模块特有的主要导出方式，导入时可以自定义名称。</p><pre><code>// math.js - 默认导出\nexport default function add(a, b) {\n  return a + b\n}\n\n// 也可以先定义后导出\nconst subtract = (a, b) =&gt; a - b\nexport default subtract\n\n// 默认导出对象\nexport default {\n  multiply: (a, b) =&gt; a * b,\n  divide: (a, b) =&gt; a / b\n}\n\n// 导入默认导出（名称可以任意）\nimport addFunction from "./math.js"\nimport myMath from "./math.js"\nimport { default as add } from "./math.js"\n\n// 混合使用\nexport default class Calculator {}\nexport const VERSION = "1.0.0"\n\n// 导入混合\nexport Calculator, { VERSION } from "./calculator.js"</code></pre>',
    tags: ['默认导出', '默认导入', 'export default']
  },
  'esm-named': {
    title: '命名导出',
    body: '<p class="lead">命名导出可以导出多个值，导入时必须使用相同的名称。</p><pre><code>// 逐个导出\nexport const PI = 3.14159\nexport const E = 2.71828\nexport function circleArea(radius) {\n  return PI * radius * radius\n}\n\n// 批量导出\nconst firstName = "Alice"\nconst lastName = "Smith"\nconst age = 25\nexport { firstName, lastName, age }\n\n// 工具模块示例\nexport function formatDate(date) {\n  return date.toISOString().split("T")[0]\n}\nexport function formatCurrency(amount) {\n  return `$${amount.toFixed(2)}`\n}\nexport const API_URL = "https://api.example.com"\n\n// 导入使用\nimport { PI, circleArea, formatDate, API_URL } from "./utils.js"</code></pre>',
    tags: ['命名导出', '命名导入', '批量导出']
  },
  'esm-rename': {
    title: '重命名导入导出',
    body: '<p class="lead">在导入和导出时可以使用 as 关键字重命名。</p><pre><code>// 导出时重命名\nconst user = { id: 1, name: "Alice" }\nconst getUser = () =&gt; user\nexport { user as currentUser, getUser as fetchUser }\n\n// 导入时重命名\nimport { currentUser as user, fetchUser as getUser } from "./user.js"\n\n// 解决命名冲突\nimport { Component as ReactComponent } from "react"\nimport { Component as VueComponent } from "vue"\n\n// 重命名默认导入\nexport default class Logger {}\nimport { default as LoggerClass } from "./logger.js"\n\n// 重命名并重新导出\nexport { function1 as fn1, function2 as fn2 } from "./utils.js"</code></pre>',
    tags: ['重命名', 'as关键字', '别名']
  },
  'esm-aggregate': {
    title: '聚合导出',
    body: '<p class="lead">聚合导出允许将多个模块的导出集中在一个模块中。</p><pre><code>// index.js - 聚合导出\nexport { add, subtract } from "./math.js"\nexport { formatDate, formatCurrency } from "./formatters.js"\nexport { default as Calculator } from "./calculator.js"\nexport * from "./constants.js"\n\n// 重新导出并重命名\nexport { multiply as mul, divide as div } from "./operations.js"\n\n// 排除默认导出\nexport * from "./module.js"  // 不包括默认导出\nexport { default } from "./module.js"  // 单独导出默认\n\n// 使用聚合导出\n// 现在只需导入一个入口文件\nimport { add, formatDate, Calculator, PI } from "./index.js"</code></pre>',
    tags: ['聚合导出', '重新导出', 'barrel']
  },
  'esm-dynamic': {
    title: '动态导入 import()',
    body: '<p class="lead">import() 函数允许在运行时动态加载模块，返回 Promise。</p><pre><code>// 动态导入语法\nimport("./module.js").then(module => {\n  module.doSomething()\n})\n\n// 使用 async/await\nasync function loadModule() {\n  const module = await import("./module.js")\n  module.doSomething()\n}\n\n// 条件加载\nif (user.isAdmin) {\n  const adminModule = await import("./admin.js")\n  adminModule.init()\n}\n\n// 按需加载\nbutton.addEventListener("click", async () => {\n  const dialog = await import("./dialog.js")\n  dialog.show()\n})\n\n// 动态加载默认导出\nconst module = await import("./module.js")\nconst defaultExport = module.default\n\n// 动态加载指定导出\nconst { namedExport } = await import("./module.js")\n\n// 模块路径可以是变量\nconst moduleName = "./" + fileName + ".js"\nconst module = await import(moduleName)</code></pre>',
    tags: ['动态导入', 'import()', '代码分割']
  },
  'esm-script-tag': {
    title: 'script 标签使用',
    body: '<p class="lead">在 HTML 中使用 type="module" 的 script 标签加载 ES Module。</p><pre><code>&lt;!-- 基本用法 --&gt;\n&lt;script type="module" src="./main.js"&gt;&lt;/script&gt;\n\n&lt;!-- 内联模块脚本 --&gt;\n&lt;script type="module"&gt;\n  import { greet } from "./utils.js"\n  console.log(greet("Alice"))\n&lt;/script&gt;\n\n&lt;!-- 异步加载 --&gt;\n&lt;script type="module" async src="./async.js"&gt;&lt;/script&gt;\n\n&lt;!-- 延迟加载（默认行为） --&gt;\n&lt;script type="module" defer src="./defer.js"&gt;&lt;/script&gt;\n\n&lt;!-- 导入映射（Import Maps） --&gt;\n&lt;script type="importmap"&gt;\n  {\n    "imports": {\n      "lodash": "https://cdn.skypack.dev/lodash",\n      "react": "https://cdn.skypack.dev/react"\n    }\n  }\n&lt;/script&gt;\n\n&lt;script type="module"&gt;\n  import _ from "lodash"\n  import React from "react"\n&lt;/script&gt;</code></pre>',
    tags: ['type="module"', 'script标签', 'Import Maps']
  },
  'esm-nodejs': {
    title: 'Node.js 中使用',
    body: '<p class="lead">Node.js 从版本 12 开始原生支持 ES Module。</p><pre><code>// 方式一：使用 .mjs 扩展名\n// file.mjs\nexport const greeting = "Hello"\n\n// 方式二：在 package.json 中设置 "type": "module"\n{\n  "name": "my-app",\n  "type": "module",\n  "scripts": {\n    "start": "node index.js"\n  }\n}\n\n// index.js（ES Module 语法）\nimport fs from "fs"\nimport path from "path"\nimport { greeting } from "./file.js"\n\n// 导入 CommonJS 模块\nimport packageJson from "./package.json"  // 自动处理\n\n// 使用动态导入加载 CommonJS\nconst cjsModule = await import("./cjs-module.cjs")\n\n// 命令行参数\nnode --experimental-specifier-resolution=node index.js\nnode --loader ts-node/esm index.ts  // 加载器支持</code></pre>',
    tags: ['Node.js', '.mjs', 'type=module']
  },
  'esm-package-json': {
    title: 'package.json 配置',
    body: '<p class="lead">通过 package.json 配置 ES Module 的入口和行为。</p><pre><code>{\n  "name": "my-package",\n  "type": "module",           // 使用 ES Module\n  "main": "index.js",         // CommonJS 入口\n  "module": "index.mjs",      // ES Module 入口\n  "exports": {\n    ".": {\n      "import": "./index.mjs",\n      "require": "./index.cjs",\n      "default": "./index.js"\n    },\n    "./feature": {\n      "import": "./feature.mjs",\n      "require": "./feature.cjs"\n    },\n    "./package.json": "./package.json"\n  },\n  "imports": {\n    "#internal/*": "./src/internal/*"\n  },\n  "sideEffects": false         // 标记无副作用，支持 Tree Shaking\n}\n\n// 使用 imports 别名\nimport helper from "#internal/helper.js"</code></pre>',
    tags: ['package.json', 'exports', 'imports']
  },
  'esm-import-meta': {
    title: 'import.meta',
    body: '<p class="lead">import.meta 是一个包含模块元数据的对象。</p><pre><code>// 获取当前模块 URL\nconsole.log(import.meta.url)\n// file:///path/to/module.js\n\n// 获取模块路径（Node.js）\nimport { fileURLToPath } from "url"\nconst __filename = fileURLToPath(import.meta.url)\nconst __dirname = path.dirname(__filename)\n\n// 开发环境判断\nif (import.meta.env?.DEV) {\n  console.log("开发模式")\n}\n\n// 动态导入辅助\nconst modulePath = new URL("./module.js", import.meta.url)\nconst module = await import(modulePath)\n\n// Vite 中的 import.meta.env\nconsole.log(import.meta.env.VITE_API_URL)\n\n// import.meta.resolve (Node.js 18+)\nconst resolved = import.meta.resolve("lodash")\nconsole.log(resolved)</code></pre>',
    tags: ['import.meta', '元数据', '模块信息']
  },
  'esm-vs-cjs': {
    title: 'ESM vs CommonJS',
    body: '<p class="lead">ES Module 和 CommonJS 两种模块系统的主要区别。</p><table class="mdn-table"><thead><tr><th>特性</th><th>ES Module</th><th>CommonJS</th></tr></thead><tbody><tr><td>加载时机</th><td>编译时静态</th><td>运行时动态</tr><tr><td>加载方式</th><td>异步</th><td>同步</tr><tr><td>语法</th><td>import/export</th><td>require/module.exports</tr><tr><td>值绑定</th><td>值的引用（只读）</th><td>值的拷贝</tr><tr><td>静态分析</th><td>支持（Tree Shaking）</th><td>不支持</tr><tr><td>浏览器支持</th><td>原生</th><td>需要打包</tr><tr><td>this 指向</th>}</ul><pre><code>// CommonJS\nlet count = 0\nmodule.exports.increment = () =&gt; ++count\nmodule.exports.count = count\n\n// ES Module\nexport let count = 0\nexport function increment() {\n  count++\n}</code></pre>',
    tags: ['CommonJS', '对比', '模块系统']
  },
  'esm-vs-amd': {
    title: 'ESM vs AMD',
    body: '<p class="lead">ES Module 和 AMD 两种模块系统的主要区别。</p><table class="mdn-table"><thead><tr><th>特性</th><th>ES Module</th><th>AMD</th></tr></thead><tbody><tr><td>标准化</th><td>语言标准</th><td>社区规范</tr><tr><td>加载方式</th><td>异步（编译时解析）</th><td>异步（运行时）</tr><tr><td>语法</th><td>import/export</th><td>define/require</tr><tr><td>静态分析</th><td>支持</th><td>不支持</tr><tr><td>循环依赖</th><td>有限支持</th><td>可处理</tr><tr><td>浏览器原生</th><td>支持</th><td>需要加载器</tr><tr><td>学习曲线</th></td>平缓</th><td>较陡</tr></tbody></table><pre><code>// AMD\ndefine(["jquery"], function($) {\n  return { doSomething: () =&gt; {} }\n})\n\n// ES Module\nimport $ from "jquery"\nexport const doSomething = () =&gt; {}</code></pre>',
    tags: ['AMD', '对比', '异步模块']
  },
  'esm-interop': {
    title: '与 CJS 互操作',
    body: '<p class="lead">ES Module 与 CommonJS 之间的互操作性。</p><pre><code>// Node.js 中导入 CommonJS\n// ESM 可以直接导入 CJS 模块\nimport fs from "fs"\nimport express from "express"\nimport myCjsModule from "./my-module.cjs"\n\n// CommonJS 中导入 ESM（使用动态导入）\n// index.cjs\nasync function loadESM() {\n  const esmModule = await import("./esm-module.mjs")\n  return esmModule\n}\n\n// 处理默认导出差异\nimport cjsModule from "./cjs-module.cjs"\n// CJS 的 module.exports 被当作默认导出\n\n// 使用 createRequire（ESM 中导入 CJS）\nimport { createRequire } from "module"\nconst require = createRequire(import.meta.url)\nconst lodash = require("lodash")\n\n// 条件导出 package.json\n{\n  "exports": {\n    "require": "./index.cjs",\n    "import": "./index.mjs"\n  }\n}</code></pre>',
    tags: ['互操作', 'CJS导入', 'createRequire']
  },
  'esm-top-level-await': {
    title: '顶层 await',
    body: '<p class="lead">顶层 await 允许在模块顶层使用 await，无需 async 函数包裹。</p><pre><code>// 模块中使用顶层 await\n// data.js\nconst response = await fetch("/api/data")\nconst data = await response.json()\nexport default data\n\n// 使用模块\nimport data from "./data.js"\nconsole.log(data)  // 等待加载完成\n\n// 动态加载\nconst module = await import("./module.js")\n\n// 多个顶层 await（并行）\nconst [user, posts] = await Promise.all([\n  fetch("/api/user").then(r =&gt; r.json()),\n  fetch("/api/posts").then(r =&gt; r.json())\n])\n\n// 依赖关系\n// 被依赖的模块会先执行 await\n// a.js\nexport const a = await Promise.resolve(1)\n\n// b.js\nimport { a } from "./a.js"\nexport const b = a + 1</code></pre>',
    tags: ['顶层await', '异步加载', '模块等待']
  },
  'esm-import-assert': {
    title: '导入断言',
    body: '<p class="lead">导入断言用于声明导入资源的类型。</p><pre><code>// 导入 JSON 文件\nimport data from "./data.json" assert { type: "json" }\nconsole.log(data)\n\n// 导入 CSS 文件\nimport styles from "./styles.css" assert { type: "css" }\ndocument.adoptedStyleSheets = [styles]\n\n// 导入 HTML 文件（需要相应加载器）\nimport template from "./template.html" assert { type: "html" }\n\n// 动态导入时使用断言\nconst data = await import("./data.json", {\n  assert: { type: "json" }\n})\n\n// 多个断言（实验性）\nimport wasm from "./module.wasm" assert {\n  type: "webassembly",\n  version: "v1"\n}\n\n// 注意：导入断言语法仍在演进中</code></pre>',
    tags: ['导入断言', 'JSON导入', 'assert']
  },
  'esm-import-meta-resolve': {
    title: 'import.meta.resolve',
    body: '<p class="lead">import.meta.resolve 用于解析模块的完整 URL。</p><pre><code>// 解析模块路径\nconst lodashPath = import.meta.resolve("lodash")\nconsole.log(lodashPath)\n\n// 解析相对路径\nconst utilsPath = import.meta.resolve("./utils.js")\nconsole.log(utilsPath)\n\n// 动态导入配合使用\nconst moduleUrl = import.meta.resolve(`./handlers/${name}.js`)\nconst module = await import(moduleUrl)\n\n// 在 Node.js 中使用（需要 --experimental-import-meta-resolve）\nconst resolved = import.meta.resolve("express")\n\n// 解析 package.json 的 exports\nconst subpath = import.meta.resolve("my-package/feature")\n\n// 注意：import.meta.resolve 返回的是字符串 URL\nconst url = new URL(import.meta.resolve("./file.js"), import.meta.url)</code></pre>',
    tags: ['import.meta.resolve', '路径解析', '模块解析']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 ES Module 规范获取更多信息。</p>',
        tags: ['ES Module', '模块化']
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

addLink('esm-intro', 'esm-export')
addLink('esm-export', 'esm-import')
addLink('esm-import', 'esm-default')
addLink('esm-default', 'esm-named')
addLink('esm-named', 'esm-rename')
addLink('esm-rename', 'esm-aggregate')
addLink('esm-aggregate', 'esm-dynamic')
addLink('esm-script-tag', 'esm-nodejs')
addLink('esm-nodejs', 'esm-package-json')
addLink('esm-package-json', 'esm-import-meta')
addLink('esm-vs-cjs', 'esm-vs-amd')
addLink('esm-vs-amd', 'esm-interop')
addLink('esm-top-level-await', 'esm-import-assert')
addLink('esm-import-assert', 'esm-import-meta-resolve')

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