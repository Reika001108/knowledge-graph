<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">AMD 知识库</h1>
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
          <h2>🔄 <span class="gradient-text">AMD 完全指南</span></h2>
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
          <p>🔄 异步模块定义 | 浏览器端模块化标准</p>
          <p>✨ 点击节点双向联动 | RequireJS 规范</p>
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
          <h3>🔗 AMD 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'AMD开发者'
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

// ========== AMD 导航数据 ==========
const navSections = ref([
  { title: '📖 基础入门', items: [
      { id: 'amd-intro', label: 'AMD 简介', hot: true },
      { id: 'amd-requirejs', label: 'RequireJS 介绍', hot: true },
      { id: 'amd-define', label: 'define 定义模块', hot: true },
      { id: 'amd-require', label: 'require 加载模块', hot: true }
    ]},
  { title: '📦 模块定义', items: [
      { id: 'amd-simple', label: '简单模块', hot: true },
      { id: 'amd-dependency', label: '依赖模块', hot: true },
      { id: 'amd-value', label: '值模块', hot: true },
      { id: 'amd-object', label: '对象模块', hot: true }
    ]},
  { title: '⚙️ 配置与加载', items: [
      { id: 'amd-config', label: 'require.config 配置', hot: true },
      { id: 'amd-paths', label: '路径映射', hot: true },
      { id: 'amd-shim', label: 'shim 非AMD模块', hot: true },
      { id: 'amd-map', label: '模块映射', hot: true }
    ]},
  { title: '🚀 高级特性', items: [
      { id: 'amd-optimizer', label: 'r.js 优化器', hot: true },
      { id: 'amd-plugins', label: '插件机制', hot: true },
      { id: 'amd-circular', label: '循环依赖', hot: true },
      { id: 'amd-commonjs', label: 'CommonJS 包装', hot: true }
    ]},
  { title: '🔄 与其他规范对比', items: [
      { id: 'amd-vs-cjs', label: 'AMD vs CommonJS', hot: true },
      { id: 'amd-vs-esm', label: 'AMD vs ES Modules', hot: true }
    ]}
])

const selectedId = ref('amd-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== AMD 内容映射表 ==========
const contentMap = {
  'amd-intro': {
    title: 'AMD 简介',
    body: '<p class="lead">AMD（Asynchronous Module Definition，异步模块定义）是浏览器端 JavaScript 的模块化规范，支持异步加载模块，解决浏览器环境中的依赖管理和加载性能问题。</p><h3>核心特点</h3><ul><li><strong>异步加载</strong>：模块和依赖异步加载，不阻塞页面渲染</li><li><strong>依赖前置</strong>：声明依赖后自动加载</li><li><strong>浏览器优化</strong>：支持合并打包，减少 HTTP 请求</li><li><strong>兼容性好</strong>：支持非 AMD 模块的 shim 封装</li></ul><div class="note">💡 AMD 规范由 Dojo 团队推广，RequireJS 是最著名的实现。</div>',
    tags: ['AMD', '异步模块', 'RequireJS']
  },
  'amd-requirejs': {
    title: 'RequireJS 介绍',
    body: '<p class="lead">RequireJS 是 AMD 规范最流行的实现，用于浏览器端模块化开发。</p><pre><code>// 引入 RequireJS\n&lt;script data-main="js/main" src="js/require.js"&gt;&lt;/script&gt;\n\n// 入口文件 main.js\nrequire.config({\n  baseUrl: "js",\n  paths: {\n    jquery: "lib/jquery",\n    underscore: "lib/underscore"\n  }\n})\n\nrequire(["jquery", "underscore"], function($, _) {\n  console.log("模块加载完成")\n})\n\n// 安装 RequireJS\nnpm install requirejs</code></pre>',
    tags: ['RequireJS', '异步加载', '模块加载器']
  },
  'amd-define': {
    title: 'define 定义模块',
    body: '<p class="lead">define 函数用于定义 AMD 模块，支持依赖声明和工厂函数。</p><pre><code>// 无依赖模块\ndefine(function() {\n  return {\n    add: function(a, b) { return a + b },\n    multiply: function(a, b) { return a * b }\n  }\n})\n\n// 有依赖模块\ndefine(["jquery", "underscore"], function($, _) {\n  return {\n    init: function() {\n      console.log("模块已初始化")\n    }\n  }\n})\n\n// 导出多个值\ndefine(["dependency"], function(dep) {\n  var privateVar = "private"\n  \n  function publicMethod() {\n    return privateVar\n  }\n  \n  return {\n    publicMethod: publicMethod,\n    version: "1.0.0"\n  }\n})</code></pre>',
    tags: ['define', '模块定义', '工厂函数']
  },
  'amd-require': {
    title: 'require 加载模块',
    body: '<p class="lead">require 函数用于在运行时加载 AMD 模块。</p><pre><code>// 基本用法\nrequire(["module1", "module2"], function(mod1, mod2) {\n  mod1.doSomething()\n  mod2.doSomething()\n})\n\n// 错误处理\nrequire(["module"], function(mod) {\n  // 成功回调\n}, function(err) {\n  console.error("模块加载失败:", err.requireModules)\n})\n\n// 动态加载\nfunction loadPlugin(pluginName) {\n  require([pluginName], function(plugin) {\n    plugin.init()\n  })\n}\n\n// 条件加载\nif (condition) {\n  require(["feature-a"], function(a) {\n    a.run()\n  })\n} else {\n  require(["feature-b"], function(b) {\n    b.run()\n  })\n}</code></pre>',
    tags: ['require', '模块加载', '异步加载']
  },
  'amd-simple': {
    title: '简单模块',
    body: '<p class="lead">定义简单的 AMD 模块，导出值或对象。</p><pre><code>// math.js - 导出对象\ndefine({\n  add: function(a, b) { return a + b },\n  subtract: function(a, b) { return a - b },\n  multiply: function(a, b) { return a * b },\n  divide: function(a, b) { return a / b }\n})\n\n// config.js - 导出配置对象\ndefine({\n  apiUrl: "https://api.example.com",\n  timeout: 5000,\n  debug: true\n})\n\n// 使用简单模块\nrequire(["math", "config"], function(math, config) {\n  console.log(math.add(5, 3))\n  console.log(config.apiUrl)\n})</code></pre>',
    tags: ['简单模块', '对象导出', '配置模块']
  },
  'amd-dependency': {
    title: '依赖模块',
    body: '<p class="lead">定义有依赖的 AMD 模块，声明依赖数组和工厂函数。</p><pre><code>// logger.js - 无依赖\ndefine(function() {\n  return {\n    log: function(msg) { console.log("[LOG]", msg) },\n    error: function(msg) { console.error("[ERROR]", msg) }\n  }\n})\n\n// user-service.js - 依赖其他模块\ndefine(["logger", "jquery"], function(logger, $) {\n  var UserService = {\n    getUsers: function(callback) {\n      logger.log("获取用户列表")\n      $.get("/api/users", callback)\n    },\n    getUser: function(id, callback) {\n      logger.log("获取用户: " + id)\n      $.get("/api/users/" + id, callback)\n    }\n  }\n  return UserService\n})\n\n// 多个依赖\ndefine(["jquery", "underscore", "backbone", "text!template.html"], \n  function($, _, Backbone, template) {\n    return Backbone.View.extend({\n      template: _.template(template),\n      render: function() {\n        this.$el.html(this.template(this.model.toJSON()))\n        return this\n      }\n    })\n  })</code></pre>',
    tags: ['依赖模块', '依赖注入', '工厂函数']
  },
  'amd-value': {
    title: '值模块',
    body: '<p class="lead">导出值的 AMD 模块，支持基本类型和函数返回值。</p><pre><code>// version.js - 字符串值模块\ndefine("1.0.0")\n\n// config.js - 对象值\ndefine({\n  appName: "MyApp",\n  version: "1.0.0",\n  features: ["login", "dashboard"]\n})\n\n// calculation.js - 函数返回值\ndefine(function() {\n  var result = 0\n  for (var i = 0; i &lt; 1000; i++) {\n    result += i\n  }\n  return result\n})\n\n// 使用值模块\nrequire(["version", "config", "calculation"], \n  function(version, config, calculation) {\n    console.log("版本:", version)\n    console.log("应用名:", config.appName)\n    console.log("计算结果:", calculation)\n  })</code></pre>',
    tags: ['值模块', '导出值', '常量模块']
  },
  'amd-object': {
    title: '对象模块',
    body: '<p class="lead">导出对象或类的 AMD 模块。</p><pre><code>// person.js - 类定义\ndefine(function() {\n  function Person(name, age) {\n    this.name = name\n    this.age = age\n  }\n  \n  Person.prototype.greet = function() {\n    return "Hello, " + this.name\n  }\n  \n  return Person\n})\n\n// singleton.js - 单例模式\ndefine(function() {\n  var instance = null\n  \n  function createInstance() {\n    return { data: [], count: 0 }\n  }\n  \n  return {\n    getInstance: function() {\n      if (!instance) instance = createInstance()\n      return instance\n    }\n  }\n})\n\n// 使用对象模块\nrequire(["person", "singleton"], function(Person, singleton) {\n  var alice = new Person("Alice", 25)\n  console.log(alice.greet())\n  \n  var instance1 = singleton.getInstance()\n  var instance2 = singleton.getInstance()\n  console.log(instance1 === instance2)\n})</code></pre>',
    tags: ['对象模块', '类定义', '单例模式']
  },
  'amd-config': {
    title: 'require.config 配置',
    body: '<p class="lead">通过 require.config 配置模块加载器的全局行为。</p><pre><code>require.config({\n  baseUrl: "js",\n  paths: {\n    "jquery": "lib/jquery",\n    "underscore": "lib/underscore",\n    "backbone": "lib/backbone",\n    "text": "lib/text"\n  },\n  shim: {\n    "backbone": {\n      deps: ["underscore", "jquery"],\n      exports: "Backbone"\n    },\n    "underscore": {\n      exports: "_"\n    },\n    "jquery": {\n      exports: "$"\n    }\n  },\n  waitSeconds: 7,\n  urlArgs: "v=" + (new Date()).getTime()\n})</code></pre>',
    tags: ['require.config', '配置', 'baseUrl']
  },
  'amd-paths': {
    title: '路径映射',
    body: '<p class="lead">通过 paths 配置简化模块路径。</p><pre><code>require.config({\n  baseUrl: "js",\n  paths: {\n    "jquery": "lib/jquery-3.6.0.min",\n    "lodash": "lib/lodash",\n    "moment": "lib/moment",\n    "vue": "https://unpkg.com/vue@2/dist/vue",\n    "utils": "../common/utils",\n    "debug": "empty:"\n  }\n})\n\n// 使用映射后的路径\nrequire(["jquery", "lodash", "vue"], function($, _, Vue) {\n  // 模块已加载\n})\n\n// 路径回退\nrequire.config({\n  paths: {\n    "jquery": [\n      "https://cdn.example.com/jquery",\n      "lib/jquery"\n    ]\n  }\n})</code></pre>',
    tags: ['路径映射', 'paths', 'CDN']
  },
  'amd-shim': {
    title: 'shim 非AMD模块',
    body: '<p class="lead">使用 shim 配置将非 AMD 模块包装为 AMD 模块。</p><pre><code>require.config({\n  shim: {\n    "underscore": {\n      exports: "_"\n    },\n    "backbone": {\n      deps: ["underscore", "jquery"],\n      exports: "Backbone"\n    },\n    "some-lib": {\n      exports: "SomeLib",\n      init: function() {\n        return window.SomeLib\n      }\n    }\n  }\n})\n\n// 使用 shim 模块\nrequire(["backbone", "some-lib"], function(Backbone, SomeLib) {\n  // Backbone 和 SomeLib 已可用\n})</code></pre>',
    tags: ['shim', '非AMD模块', '包装']
  },
  'amd-map': {
    title: '模块映射',
    body: '<p class="lead">通过 map 配置实现模块别名和版本控制。</p><pre><code>require.config({\n  map: {\n    "*": {\n      "css": "require-css",\n      "text": "require-text"\n    },\n    "app/main": {\n      "jquery": "jquery-private"\n    },\n    "app/old-module": {\n      "utils": "utils/v1"\n    },\n    "app/new-module": {\n      "utils": "utils/v2"\n    }\n  }\n})\n\n// 定义私有 jQuery 模块\ndefine("jquery-private", ["jquery"], function($) {\n  return $.noConflict(true)\n})</code></pre>',
    tags: ['模块映射', 'map', '版本控制']
  },
  'amd-optimizer': {
    title: 'r.js 优化器',
    body: '<p class="lead">r.js 是 RequireJS 的优化工具，用于合并压缩模块。</p><pre><code># 安装 r.js\nnpm install -g requirejs\n\n# 命令行优化\nr.js -o baseUrl=js name=main out=built.js\n\n# 配置文件 build.js\n({\n  baseUrl: "js",\n  name: "main",\n  out: "built.js",\n  optimize: "uglify2",\n  mainConfigFile: "js/main.js",\n  exclude: ["jquery"],\n  include: ["module1", "module2"],\n  paths: {\n    jquery: "empty:"\n  }\n})\n\n# 运行优化\nr.js -o build.js</code></pre>',
    tags: ['r.js', '优化器', '打包']
  },
  'amd-plugins': {
    title: '插件机制',
    body: '<p class="lead">RequireJS 插件扩展模块加载能力。</p><pre><code>// 文本插件\ndefine(["text!templates/item.html"], function(template) {\n  return {\n    render: function(data) {\n      return template.replace(/{{name}}/, data.name)\n    }\n  }\n})\n\n// CSS 插件\nrequire(["css!styles/main.css"], function() {\n  console.log("CSS 已加载")\n})\n\n// JSON 插件\ndefine(["json!data/config.json"], function(config) {\n  console.log(config.apiUrl)\n})\n\n// 自定义插件\ndefine({\n  load: function(name, req, load, config) {\n    req([name], function(mod) {\n      load(mod)\n    })\n  }\n})\n\n// 常用插件: text, css, i18n, domReady</code></pre>',
    tags: ['插件', 'text插件', 'css插件']
  },
  'amd-circular': {
    title: '循环依赖',
    body: '<p class="lead">AMD 中的循环依赖处理方式。</p><pre><code>// a.js\ndefine(["b"], function(b) {\n  console.log("A 加载中，B:", b)\n  return {\n    name: "Module A",\n    getB: function() { return b }\n  }\n})\n\n// b.js\ndefine(["a"], function(a) {\n  console.log("B 加载中，A:", a)\n  return {\n    name: "Module B",\n    getA: function() { return a }\n  }\n})\n\n// 解决方案：使用 require 延迟加载\ndefine(["require"], function(require) {\n  return {\n    doSomething: function() {\n      var b = require("b")\n    }\n  }\n})</code></pre>',
    tags: ['循环依赖', '循环引用', '解决']
  },
  'amd-commonjs': {
    title: 'CommonJS 包装',
    body: '<p class="lead">AMD 支持包装 CommonJS 模块格式。</p><pre><code>// 使用 CommonJS 风格\ndefine(function(require, exports, module) {\n  var $ = require("jquery")\n  var _ = require("underscore")\n  \n  exports.doSomething = function() {\n    console.log("Something")\n  }\n  \n  module.exports = {\n    doSomething: function() {},\n    version: "1.0.0"\n  }\n})\n\n// 混合风格\ndefine(["jquery"], function($) {\n  var _ = require("underscore")\n  \n  return {\n    process: function(data) {\n      return _.map(data, function(item) {\n        return $(item).val()\n      })\n    }\n  }\n})</code></pre>',
    tags: ['CommonJS包装', 'require', 'exports']
  },
  'amd-vs-cjs': {
    title: 'AMD vs CommonJS',
    body: '<p class="lead">AMD 和 CommonJS 两种模块规范的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>AMD</th><th>CommonJS</th></tr></thead><tbody><tr><td>设计目标</td><td>浏览器端</td><td>服务器端</td></tr><td><td>加载方式</td><td>异步</td><td>同步</td></tr><tr><td>语法</td><td>define/require</td><td>require/module.exports</td></tr><tr><td>依赖声明</td><td>依赖前置</td><td>就近 require</td></tr></tbody></table><pre><code>// AMD\ndefine(["a", "b"], function(a, b) {\n  return { result: true }\n})\n\n// CommonJS\nvar a = require("a")\nvar b = require("b")\nmodule.exports = { result: true }</code></pre>',
    tags: ['AMD', 'CommonJS', '对比']
  },
  'amd-vs-esm': {
    title: 'AMD vs ES Modules',
    body: '<p class="lead">AMD 和 ES Modules 两种模块规范的对比。</p><table class="mdn-table"><thead><tr><th>特性</th><th>AMD</th><th>ES Modules</th></tr></thead><tbody><tr><td>标准化</td><td>社区规范</td><td>语言标准</td></tr><tr><td>加载方式</td><td>异步</td><td>异步</td></tr><tr><td>语法</td><td>define/require</td><td>import/export</td></tr><tr><td>静态分析</td><td>不支持</td><td>支持</td></tr><tr><td>浏览器原生</td><td>需加载器</td><td>原生支持</td></tr></tbody></table><pre><code>// AMD\ndefine(["math"], function(math) {\n  return math.add(5, 3)\n})\n\n// ES Modules\nimport { add } from "./math.js"\nexport const result = add(5, 3)</code></pre>',
    tags: ['AMD', 'ES Modules', '对比']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 AMD 规范文档获取更多信息。</p>',
        tags: ['AMD', '模块化']
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

addLink('amd-intro', 'amd-requirejs')
addLink('amd-requirejs', 'amd-define')
addLink('amd-define', 'amd-require')
addLink('amd-simple', 'amd-dependency')
addLink('amd-dependency', 'amd-value')
addLink('amd-value', 'amd-object')
addLink('amd-config', 'amd-paths')
addLink('amd-paths', 'amd-shim')
addLink('amd-shim', 'amd-map')
addLink('amd-optimizer', 'amd-plugins')
addLink('amd-plugins', 'amd-circular')
addLink('amd-circular', 'amd-commonjs')
addLink('amd-vs-cjs', 'amd-vs-esm')

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