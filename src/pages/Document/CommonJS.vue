<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">CommonJS 知识库</h1>
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
          <h2>📦 <span class="gradient-text">CommonJS 完全指南</span></h2>
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
          <p>📦 Node.js 模块系统标准</p>
          <p>✨ 点击节点双向联动 | 服务端模块化基石</p>
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
          <h3>🔗 CommonJS 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Node.js开发者'
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

// ========== CommonJS 导航数据 ==========
const navSections = ref([
  { title: '📖 基础入门', items: [
      { id: 'cjs-intro', label: 'CommonJS 简介', hot: true },
      { id: 'cjs-require', label: 'require 函数', hot: true },
      { id: 'cjs-module-exports', label: 'module.exports', hot: true },
      { id: 'cjs-exports', label: 'exports 别名', hot: true }
    ]},
  { title: '🔧 模块加载机制', items: [
      { id: 'cjs-loading', label: '模块加载流程', hot: true },
      { id: 'cjs-cache', label: '模块缓存', hot: true },
      { id: 'cjs-resolution', label: '模块解析规则', hot: true },
      { id: 'cjs-cyclic', label: '循环依赖', hot: true }
    ]},
  { title: '📁 路径与类型', items: [
      { id: 'cjs-core-modules', label: '核心模块', hot: true },
      { id: 'cjs-file-modules', label: '文件模块', hot: true },
      { id: 'cjs-folder-modules', label: '文件夹模块', hot: true },
      { id: 'cjs-node-modules', label: 'node_modules 解析', hot: true }
    ]},
  { title: '⚙️ 高级特性', items: [
      { id: 'cjs-dynamic-require', label: '动态 require', hot: true },
      { id: 'cjs-conditional', label: '条件导出', hot: true },
      { id: 'cjs-mocking', label: '模块模拟', hot: true },
      { id: 'cjs-reload', label: '模块重载', hot: true }
    ]},
  { title: '🔄 与其他模块系统', items: [
      { id: 'cjs-vs-esm', label: 'CommonJS vs ES Modules', hot: true },
      { id: 'cjs-interop', label: '与 ESM 互操作', hot: true },
      { id: 'cjs-browser', label: '浏览器中使用', hot: true }
    ]}
])

const selectedId = ref('cjs-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== CommonJS 内容映射表 ==========
const contentMap = {
  'cjs-intro': {
    title: 'CommonJS 简介',
    body: '<p class="lead">CommonJS 是 JavaScript 的模块化规范，主要用于 Node.js 环境，定义了模块的导入导出方式，是服务端 JavaScript 的基石。</p><h3>核心特点</h3><ul><li><strong>同步加载</strong>：模块在运行时同步加载</li><li><strong>值拷贝</strong>：导出的是值的拷贝，而非引用</li><li><strong>动态模块</strong>：require 可以在运行时动态调用</li><li><strong>文件模块</strong>：一个文件就是一个模块</li><li><strong>缓存机制</strong>：模块首次加载后会被缓存</li></ul><div class="note">💡 CommonJS 规范最初由 Mozilla 工程师 Kevin Dangoor 于 2009 年提出，Node.js 是最著名的实现。</div>',
    tags: ['模块化', 'Node.js', '同步加载']
  },
  'cjs-require': {
    title: 'require 函数',
    body: '<p class="lead">require 函数用于导入其他模块，是 CommonJS 的核心导入机制。</p><pre><code>// 导入核心模块\nconst fs = require("fs")\nconst path = require("path")\nconst http = require("http")\n\n// 导入第三方模块\nconst express = require("express")\nconst lodash = require("lodash")\n\n// 导入自定义模块\nconst myModule = require("./my-module")\nconst utils = require("../utils")\n\n// 导入 JSON 文件\nconst config = require("./config.json")\n\n// require 返回的是 module.exports\nconsole.log(typeof require)  // "function"\n\n// require 保证相同模块只加载一次\nconst a = require("./counter")\nconst b = require("./counter")\nconsole.log(a === b)  // true\n\n// require.resolve 获取模块路径\nconst modulePath = require.resolve("express")\nconsole.log(modulePath)</code></pre>',
    tags: ['require', '导入', '模块加载']
  },
  'cjs-module-exports': {
    title: 'module.exports',
    body: '<p class="lead">module.exports 是 CommonJS 模块的导出对象，默认是一个空对象。</p><pre><code>// math.js - 导出单个函数\nmodule.exports = function add(a, b) {\n  return a + b\n}\n\n// 使用\nconst add = require("./math")\nconsole.log(add(2, 3))  // 5\n\n// 导出对象\nmodule.exports = {\n  add: (a, b) =&gt; a + b,\n  subtract: (a, b) =&gt; a - b,\n  multiply: (a, b) =&gt; a * b\n}\n\n// 导出类\nclass Calculator {\n  add(a, b) { return a + b }\n  multiply(a, b) { return a * b }\n}\nmodule.exports = Calculator\n\n// 导出实例\nconst calculator = new Calculator()\nmodule.exports = calculator\n\n// 导出函数和属性\nfunction greet(name) {\n  return `Hello, ${name}!`\n}\ngreet.version = "1.0.0"\nmodule.exports = greet</code></pre>',
    tags: ['module.exports', '导出', '模块导出']
  },
  'cjs-exports': {
    title: 'exports 别名',
    body: '<p class="lead">exports 是 module.exports 的引用，用于导出多个属性。</p><pre><code>// exports 是 module.exports 的引用\nconsole.log(exports === module.exports)  // true\n\n// 添加属性到 exports\nexports.name = "Alice"\nexports.age = 25\nexports.greet = function(name) {\n  return `Hello, ${name}!`\n}\n\n// 使用\nconst user = require("./user")\nconsole.log(user.name)   // "Alice"\nconsole.log(user.age)    // 25\n\n// exports 不能重新赋值\n// exports = { name: "Bob" }  // 错误！会断开引用\n\n// 正确做法：需要替换整个导出对象时使用 module.exports\nmodule.exports = { name: "Bob", age: 30 }\n\n// 混合使用\nexports.version = "1.0.0"\nmodule.exports.getClass = function() {\n  return "User"\n}\n\n// 最佳实践\n// - 导出多个属性：使用 exports.xxx\n// - 导出单个值/类/函数：使用 module.exports = xxx</code></pre>',
    tags: ['exports', '导出别名', 'module.exports']
  },
  'cjs-loading': {
    title: '模块加载流程',
    body: '<p class="lead">CommonJS 模块的加载和执行流程详解。</p><pre><code>// 模块加载流程\n// 1. 路径解析\n// 2. 检查缓存\n// 3. 创建 Module 实例\n// 4. 读取文件内容\n// 5. 包装代码\n// 6. 执行模块代码\n// 7. 返回 module.exports\n\n// 包装后的模块代码\n// (function(exports, require, module, __filename, __dirname) {\n//   // 模块代码\n//   exports.greet = function() { return "Hello" }\n// })\n\n// 模块内的可用变量\nconsole.log(__filename)  // 当前文件的绝对路径\nconsole.log(__dirname)   // 当前文件所在目录的绝对路径\n\n// 加载顺序\n// 1. 先加载核心模块\n// 2. 再加载文件模块\n// 3. 最后加载第三方模块\n\n// 示例：自定义模块\n// module-a.js\nconsole.log("模块 A 开始加载")\nmodule.exports = { name: "Module A" }\nconsole.log("模块 A 加载完成")\n\n// main.js\nconsole.log("主模块开始")\nconst a = require("./module-a")\nconsole.log("主模块结束")</code></pre>',
    tags: ['加载流程', '包装函数', '__filename']
  },
  'cjs-cache': {
    title: '模块缓存',
    body: '<p class="lead">require.cache 存储已加载的模块，避免重复加载。</p><pre><code>// 模块缓存机制\n// require.cache 是一个对象，存储所有已加载的模块\n\n// 查看缓存\nconsole.log(require.cache)\n\n// 模块被缓存后，第二次 require 返回缓存中的对象\nconst a = require("./module")\nconst b = require("./module")\nconsole.log(a === b)  // true\n\n// 删除缓存\nconst modulePath = require.resolve("./my-module")\ndelete require.cache[modulePath]\n\n// 重新加载模块（清除缓存后）\nconst freshModule = require("./my-module")\n\n// 清除所有缓存\nObject.keys(require.cache).forEach(key =&gt; {\n  delete require.cache[key]\n})\n\n// 带缓存的计数器示例\n// counter.js\nlet count = 0\nmodule.exports.increment = () =&gt; ++count\nmodule.exports.getCount = () =&gt; count\n\n// main.js\nconst counter1 = require("./counter")\nconst counter2 = require("./counter")\ncounter1.increment()\nconsole.log(counter2.getCount())  // 1（共享同一缓存）</code></pre>',
    tags: ['缓存', 'require.cache', '模块缓存']
  },
  'cjs-resolution': {
    title: '模块解析规则',
    body: '<p class="lead">Node.js 解析 require 路径的完整规则。</p><pre><code>// 解析优先级\n// 1. 核心模块 (fs, path, http 等)\nrequire("fs")        // 直接使用核心模块\n\n// 2. 文件模块 (/, ./, ../)\nrequire("./module")      // 尝试 .js, .json, .node\nrequire("./module.js")   // 明确扩展名\nrequire("./module.json") // JSON 文件直接解析为对象\nrequire("./module.node") // Node.js 原生插件\n\n// 3. 文件夹模块\nrequire("./lib")\n// Node.js 会查找:\n// - ./lib/package.json 的 main 字段\n// - ./lib/index.js\n// - ./lib/index.json\n// - ./lib/index.node\n\n// 4. node_modules 查找\nrequire("lodash")\n// 查找顺序:\n// - ./node_modules/lodash\n// - ../node_modules/lodash\n// - ../../node_modules/lodash\n// - 直到根目录\n\n// 5. 全局安装的模块\n// NODE_PATH 环境变量指定的路径</code></pre>',
    tags: ['模块解析', '路径解析', 'node_modules']
  },
  'cjs-cyclic': {
    title: '循环依赖',
    body: '<p class="lead">CommonJS 中循环依赖的处理机制。</p><pre><code>// a.js\nconsole.log("a 开始加载")\nconst b = require("./b")\nconsole.log("a 中 b:", b)\nmodule.exports = { name: "Module A" }\nconsole.log("a 加载完成")\n\n// b.js\nconsole.log("b 开始加载")\nconst a = require("./a")\nconsole.log("b 中 a:", a)\nmodule.exports = { name: "Module B" }\nconsole.log("b 加载完成")\n\n// 执行 a.js 的输出\n// a 开始加载\n// b 开始加载\n// b 中 a: {}        // 此时 a 尚未完成，返回空对象\n// b 加载完成\n// a 中 b: { name: "Module B" }\n// a 加载完成\n\n// 安全处理循环依赖\n// a.js\nconst b = require("./b")\nmodule.exports = {\n  name: "Module A",\n  getB() { return b }  // 通过函数延迟访问\n}\n\n// 避免循环依赖的最佳实践\n// 1. 提取共享代码到新模块\n// 2. 使用事件/消息模式解耦\n// 3. 使用依赖注入</code></pre>',
    tags: ['循环依赖', '循环引用', '模块加载']
  },
  'cjs-core-modules': {
    title: '核心模块',
    body: '<p class="lead">Node.js 内置的核心模块，无需安装即可使用。</p><pre><code>// 文件系统模块\nconst fs = require("fs")\nfs.readFileSync("./file.txt", "utf8")\n\n// 路径模块\nconst path = require("path")\npath.join("/user", "local", "bin")\n\n// HTTP 模块\nconst http = require("http")\nhttp.createServer((req, res) =&gt; res.end("Hello"))\n\n// 操作系统模块\nconst os = require("os")\nconsole.log(os.cpus(), os.totalmem())\n\n// 事件模块\nconst EventEmitter = require("events")\nclass MyEmitter extends EventEmitter {}\n\n// 子进程模块\nconst { exec } = require("child_process")\nexec("ls -la", (err, stdout) =&gt; console.log(stdout))\n\n// 加密模块\nconst crypto = require("crypto")\nconst hash = crypto.createHash("sha256")\n\n// URL 模块\nconst url = require("url")\nconst parsed = url.parse("https://example.com/path?q=1")</code></pre>',
    tags: ['核心模块', '内置模块', 'Node.js API']
  },
  'cjs-file-modules': {
    title: '文件模块',
    body: '<p class="lead">使用文件路径导入自定义模块。</p><pre><code>// 项目结构\n// project/\n//   ├── index.js\n//   ├── lib/\n//   │   ├── math.js\n//   │   ├── string.js\n//   │   └── index.js\n//   └── utils/\n//       └── helper.js\n\n// 相对路径导入\nconst math = require("./lib/math")\nconst helper = require("../utils/helper")\n\n// 文件扩展名可省略（按顺序尝试 .js, .json, .node）\nconst math = require("./lib/math")     // 加载 math.js\nconst data = require("./data")         // 加载 data.js 或 data.json\n\n// JSON 文件自动解析为对象\nconst config = require("./config.json")\nconsole.log(config.port)\n\n// 加载 .node 原生模块\nconst addon = require("./build/Release/addon.node")\n\n// 动态路径\nconst moduleName = "./lib/math"\nconst dynamicModule = require(moduleName)</code></pre>',
    tags: ['文件模块', '相对路径', '自定义模块']
  },
  'cjs-folder-modules': {
    title: '文件夹模块',
    body: '<p class="lead">使用文件夹作为模块，通过 package.json 或 index 文件入口。</p><pre><code>// lib 文件夹结构\n// lib/\n//   ├── package.json\n//   ├── index.js\n//   └── other.js\n\n// package.json 指定入口\n{\n  "name": "my-lib",\n  "version": "1.0.0",\n  "main": "index.js"      // 入口文件\n}\n\n// 导入文件夹\nconst myLib = require("./lib")\n// 加载顺序:\n// 1. 查找 ./lib/package.json 的 main 字段\n// 2. 如果 main 不存在，尝试 ./lib/index.js\n// 3. 尝试 ./lib/index.json\n// 4. 尝试 ./lib/index.node\n\n// 没有 package.json 时\n// lib/index.js\nmodule.exports = {\n  add: (a, b) =&gt; a + b,\n  multiply: (a, b) =&gt; a * b\n}\n\n// 使用\nconst { add, multiply } = require("./lib")\n\n// 多层文件夹入口\n// tools/\n//   ├── index.js\n//   └── helpers/\n//       └── index.js</code></pre>',
    tags: ['文件夹模块', 'package.json', 'main入口']
  },
  'cjs-node-modules': {
    title: 'node_modules 解析',
    body: '<p class="lead">Node.js 在 node_modules 中查找第三方模块的规则。</p><pre><code>// 项目结构\n// my-app/\n//   ├── node_modules/\n//   │   ├── lodash/\n//   │   │   └── index.js\n//   │   └── express/\n//   │       └── index.js\n//   ├── src/\n//   │   └── index.js\n//   └── package.json\n\n// 导入第三方模块\nconst lodash = require("lodash")     // 查找 ./node_modules/lodash\nconst express = require("express")   // 查找 ./node_modules/express\n\n// 查找顺序（向上递归）\n// 1. ./node_modules/package\n// 2. ../node_modules/package\n// 3. ../../node_modules/package\n// 4. 直到根目录\n\n// 嵌套依赖\n// node_modules/\n//   ├── package-a/\n//   │   └── node_modules/\n//   │       └── package-b/\n//   └── package-b/  (顶层也可能有)\n\n// 查看模块解析路径\nconsole.log(require.resolve("lodash"))\n\n// 模块路径数组\nconsole.log(module.paths)</code></pre>',
    tags: ['node_modules', '第三方模块', '模块查找']
  },
  'cjs-dynamic-require': {
    title: '动态 require',
    body: '<p class="lead">使用变量动态加载模块。</p><pre><code>// 根据条件动态加载\nlet module\nif (process.env.NODE_ENV === "production") {\n  module = require("./prod-module")\n} else {\n  module = require("./dev-module")\n}\n\n// 使用变量路径\nconst moduleName = "./handlers/" + handlerName\nconst handler = require(moduleName)\n\n// 动态加载所有模块\nconst modules = {}\nconst moduleNames = ["fs", "path", "http"]\nmoduleNames.forEach(name =&gt; {\n  modules[name] = require(name)\n})\n\n// 插件系统\nclass PluginManager {\n  constructor(pluginsDir) {\n    this.plugins = {}\n    this.pluginsDir = pluginsDir\n  }\n  \n  loadPlugin(name) {\n    const pluginPath = `${this.pluginsDir}/${name}`\n    this.plugins[name] = require(pluginPath)\n  }\n}\n\n// 动态导入 JSON 配置\nconst env = process.env.NODE_ENV || "development"\nconst config = require(`./config/${env}.json`)</code></pre>',
    tags: ['动态require', '条件加载', '插件系统']
  },
  'cjs-conditional': {
    title: '条件导出',
    body: '<p class="lead">根据条件导出不同的模块内容。</p><pre><code>// 根据环境变量导出\nlet config\nif (process.env.NODE_ENV === "production") {\n  config = {\n    apiUrl: "https://api.example.com",\n    debug: false\n  }\n} else {\n  config = {\n    apiUrl: "http://localhost:3000",\n    debug: true\n  }\n}\nmodule.exports = config\n\n// 根据平台导出\nlet platformSpecific\nif (process.platform === "win32") {\n  platformSpecific = require("./win32-impl")\n} else if (process.platform === "darwin") {\n  platformSpecific = require("./darwin-impl")\n} else {\n  platformSpecific = require("./linux-impl")\n}\nmodule.exports = platformSpecific\n\n// 根据 Node.js 版本\nconst majorVersion = process.versions.node.split(".")[0]\nif (majorVersion >= 14) {\n  module.exports = require("./modern-impl")\n} else {\n  module.exports = require("./legacy-impl")\n}\n\n// 可选依赖\ntry {\n  const optional = require("optional-dependency")\n  module.exports = optional\n} catch (err) {\n  module.exports = require("./fallback")\n}</code></pre>',
    tags: ['条件导出', '环境变量', '平台判断']
  },
  'cjs-mocking': {
    title: '模块模拟',
    body: '<p class="lead">在测试中模拟 CommonJS 模块。</p><pre><code>// 使用 proxyquire 模拟模块\nconst proxyquire = require("proxyquire")\n\nconst myModule = proxyquire("./my-module", {\n  fs: {\n    readFileSync: () =&gt; "mocked content"\n  },\n  "./dependency": {\n    doSomething: () =&gt; "mocked result"\n  }\n})\n\n// 手动模拟（修改缓存）\nconst modulePath = require.resolve("./database")\nrequire.cache[modulePath] = {\n  exports: {\n    query: () =&gt; Promise.resolve([{ id: 1, name: "Mock" }])\n  }\n}\n\n// 使用 rewire 访问私有成员\nconst rewire = require("rewire")\nconst myModule = rewire("./my-module")\nconst privateFunction = myModule.__get__("privateFunction")\n\n// Jest 模拟\njest.mock("./api", () =&gt; ({\n  fetchData: jest.fn(() =&gt; Promise.resolve({ data: "mock" }))\n}))\n\n// Sinon 模拟\nconst sinon = require("sinon")\nconst fs = require("fs")\nsinon.stub(fs, "readFileSync").returns("stubbed content")</code></pre>',
    tags: ['模拟', '测试', 'proxyquire']
  },
  'cjs-reload': {
    title: '模块重载',
    body: '<p class="lead">清除缓存后重新加载模块。</p><pre><code>// 基础重载函数\nfunction reloadModule(modulePath) {\n  const resolvedPath = require.resolve(modulePath)\n  delete require.cache[resolvedPath]\n  return require(modulePath)\n}\n\n// 使用\nconst config = require("./config")\nconsole.log(config.port)\n\n// 修改配置文件后重载\nconst newConfig = reloadModule("./config")\nconsole.log(newConfig.port)\n\n// 热重载所有模块\nfunction reloadAllModules() {\n  Object.keys(require.cache).forEach(key =&gt; {\n    delete require.cache[key]\n  })\n}\n\n// 重载特定模块及其依赖\nfunction reloadWithDependencies(modulePath) {\n  const resolvedPath = require.resolve(modulePath)\n  const module = require.cache[resolvedPath]\n  \n  if (module) {\n    // 清除子模块\n    module.children.forEach(child =&gt; {\n      delete require.cache[child.id]\n    })\n    delete require.cache[resolvedPath]\n  }\n  \n  return require(modulePath)\n}\n\n// 开发环境热重载（如 nodemon 原理）\nif (process.env.NODE_ENV === "development") {\n  fs.watchFile(modulePath, () =&gt; {\n    reloadModule(modulePath)\n  })\n}</code></pre>',
    tags: ['重载', '热重载', '缓存清除']
  },
  'cjs-vs-esm': {
    title: 'CommonJS vs ES Modules',
    body: '<p class="lead">CommonJS 和 ES Modules 的主要区别。</p><table class="mdn-table"><thead><tr><th>特性</th><th>CommonJS</th><th>ES Modules</th></tr></thead><tbody><tr><td>加载方式</th><td>同步</td><td>异步</td></tr><tr><td>语法</th><td>require/module.exports</td><td>import/export</td></tr><tr><td>静态分析</th><td>动态（运行时）</td><td>静态（编译时）</td></tr><tr><td>值绑定</th><td>值的拷贝</td><td>值的引用（只读）</td></tr><tr><td>Tree Shaking</th><td>不支持</td><td>支持</td></tr><tr><td>浏览器支持</th><td>需要打包工具</td><td>原生支持（type="module"）</td></tr></tbody></table><pre><code>// CommonJS\nconst fs = require("fs")\nmodule.exports = { name: "Alice" }\n\n// ES Modules\nimport fs from "fs"\nexport const name = "Alice"\n\n// CommonJS 值拷贝\n// counter.js\nlet count = 0\nmodule.exports.increment = () =&gt; ++count\nmodule.exports.count = count\n\n// 主文件\nconst counter = require("./counter")\nconsole.log(counter.count)  // 0\ncounter.increment()\nconsole.log(counter.count)  // 0（仍然是拷贝）</code></pre>',
    tags: ['ES Modules', '对比', '模块规范']
  },
  'cjs-interop': {
    title: '与 ESM 互操作',
    body: '<p class="lead">CommonJS 和 ES Modules 之间的互操作性。</p><pre><code>// 在 ESM 中导入 CommonJS\n// 使用动态 import\nconst cjsModule = await import("cjs-package")\n\n// 使用 createRequire\nimport { createRequire } from "module"\nconst require = createRequire(import.meta.url)\nconst cjsModule = require("cjs-package")\n\n// 在 CommonJS 中导入 ESM（需要动态 import）\nasync function loadESM() {\n  const esmModule = await import("esm-package")\n  return esmModule\n}\n\n// package.json 配置\n{\n  "type": "module",        // 项目使用 ESM\n  "main": "index.js",      // CommonJS 入口\n  "module": "index.mjs",   // ESM 入口\n  "exports": {\n    "require": "./index.cjs",\n    "import": "./index.mjs"\n  }\n}\n\n// 双模式包开发\n// 条件导出\nconst isESM = typeof module !== "undefined" &amp;&amp; module.exports\nif (isESM) {\n  export default { hello: "world" }\n} else {\n  module.exports = { hello: "world" }\n}</code></pre>',
    tags: ['互操作', 'ESM导入', '条件导出']
  },
  'cjs-browser': {
    title: '浏览器中使用',
    body: '<p class="lead">在浏览器中使用 CommonJS 模块的方法。</p><pre><code>// 使用 Browserify\n// 安装: npm install -g browserify\n// 打包: browserify main.js -o bundle.js\n\n// 使用 Webpack\n// webpack.config.js\nmodule.exports = {\n  target: "web",\n  resolve: {\n    extensions: [".js"]\n  }\n}\n\n// 使用 Rollup（需要插件）\nimport commonjs from "@rollup/plugin-commonjs"\n\nexport default {\n  plugins: [commonjs()]\n}\n\n// 使用 RequireJS (AMD 风格)\n// 将 CommonJS 转换为 AMD\ndefine(function(require, exports, module) {\n  const lodash = require("lodash")\n  module.exports = { ... }\n})\n\n// 使用 ESBuild\nrequire("esbuild").build({\n  entryPoints: ["app.js"],\n  bundle: true,\n  format: "iife",\n  outfile: "bundle.js"\n})\n\n// 使用 Vite（默认支持 ESM，需要插件）</code></pre>',
    tags: ['浏览器', '打包工具', 'Browserify']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 CommonJS 规范文档获取更多信息。</p>',
        tags: ['CommonJS', '模块系统']
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

addLink('cjs-intro', 'cjs-require')
addLink('cjs-require', 'cjs-module-exports')
addLink('cjs-module-exports', 'cjs-exports')
addLink('cjs-loading', 'cjs-cache')
addLink('cjs-cache', 'cjs-resolution')
addLink('cjs-resolution', 'cjs-cyclic')
addLink('cjs-core-modules', 'cjs-file-modules')
addLink('cjs-file-modules', 'cjs-folder-modules')
addLink('cjs-folder-modules', 'cjs-node-modules')
addLink('cjs-dynamic-require', 'cjs-conditional')
addLink('cjs-conditional', 'cjs-mocking')
addLink('cjs-mocking', 'cjs-reload')
addLink('cjs-vs-esm', 'cjs-interop')
addLink('cjs-interop', 'cjs-browser')

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