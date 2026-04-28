<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Babel 知识库</h1>
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
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>🔄 <span class="gradient-text">Babel 完全指南</span></h2>
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
          <p>🔄 JavaScript 编译器 | 下一代 JS 语法转换器</p>
          <p>✨ 点击节点双向联动 | 插件化架构</p>
        </div>
      </aside>

      <!-- 中间内容区 -->
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

      <!-- 右侧图谱 -->
      <aside class="graph-panel">
        <div class="graph-header">
          <h3>🔗 Babel 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Babel用户'
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

// ========== Babel 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'babel-intro', label: 'Babel 简介', hot: true },
      { id: 'babel-install', label: '安装与配置', hot: true },
      { id: 'babel-cli', label: '命令行使用', hot: true },
      { id: 'babel-config', label: '配置文件', hot: true }
    ]},
  { title: '🔧 核心概念', items: [
      { id: 'presets', label: 'Presets 预设', hot: true },
      { id: 'plugins', label: 'Plugins 插件', hot: true },
      { id: 'babel-env', label: '@babel/preset-env', hot: true },
      { id: 'polyfill', label: 'Polyfill 处理', hot: true }
    ]},
  { title: '📦 常用预设', items: [
      { id: 'preset-react', label: '@babel/preset-react', hot: true },
      { id: 'preset-typescript', label: '@babel/preset-typescript', hot: true },
      { id: 'preset-flow', label: '@babel/preset-flow' }
    ]},
  { title: '⚙️ 集成与工具', items: [
      { id: 'babel-webpack', label: 'Webpack 集成', hot: true },
      { id: 'babel-vite', label: 'Vite 集成', hot: true },
      { id: 'babel-jest', label: 'Jest 测试', hot: true },
      { id: 'babel-node', label: '@babel/node' }
    ]},
  { title: '🎨 高级特性', items: [
      { id: 'babel-parser', label: 'AST 解析', hot: true },
      { id: 'custom-plugin', label: '自定义插件', hot: true },
      { id: 'babel-macro', label: 'Babel Macros' },
      { id: 'babel-helper', label: '辅助函数' }
    ]}
])

const selectedId = ref('babel-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Babel 内容映射表 ==========
const contentMap = {
  'babel-intro': {
    title: 'Babel 简介',
    body: '<p class="lead">Babel 是一个 JavaScript 编译器，主要用于将 ECMAScript 2015+ 代码转换为向后兼容的 JavaScript 版本，确保在旧版浏览器或环境中运行。</p><h3>核心功能</h3><ul><li><strong>语法转换</strong>：将新语法转换为旧版本兼容语法</li><li><strong>Polyfill</strong>：通过 core-js 补充缺失的 API</li><li><strong>源码转换</strong>：支持 JSX、TypeScript、Flow 等</li><li><strong>插件化架构</strong>：按需加载，灵活可扩展</li></ul><div class="note">💡 Babel 名称来源于"巴比伦塔"，寓意连接不同 JavaScript 环境。</div>',
    tags: ['编译器', 'JavaScript', '兼容性']
  },
  'babel-install': {
    title: '安装与配置',
    body: '<p class="lead">Babel 可以通过 npm 安装，核心包为 @babel/core。</p><pre><code># 安装核心包\nnpm install --save-dev @babel/core\n\n# 安装 CLI 工具\nnpm install --save-dev @babel/cli\n\n# 安装预设\nnpm install --save-dev @babel/preset-env\n\n# 创建配置文件\necho \'{ "presets": ["@babel/preset-env"] }\' > babel.config.json\n\n# 运行转换\nnpx babel src --out-dir lib</code></pre>',
    tags: ['安装', '配置', 'CLI']
  },
  'babel-cli': {
    title: '命令行使用',
    body: '<p class="lead">@babel/cli 提供命令行工具，方便快速转换文件。</p><pre><code># 转换单个文件\nnpx babel script.js --out-file script-compiled.js\n\n# 转换整个目录\nnpx babel src --out-dir lib\n\n# 监听文件变化\nnpx babel src --out-dir lib --watch\n\n# 生成 source maps\nnpx babel src --out-dir lib --source-maps\n\n# 忽略特定文件\nnpx babel src --out-dir lib --ignore "src/**/*.test.js"</code></pre>',
    tags: ['CLI', '命令行', '转换']
  },
  'babel-config': {
    title: '配置文件',
    body: '<p class="lead">Babel 支持多种配置文件格式，推荐使用 babel.config.json。</p><pre><code>// babel.config.json\n{\n  "presets": [\n    ["@babel/preset-env", {\n      "targets": "> 0.25%, not dead"\n    }]\n  ],\n  "plugins": [\n    "@babel/plugin-transform-runtime",\n    ["@babel/plugin-proposal-decorators", { "legacy": true }]\n  ],\n  "ignore": ["node_modules"],\n  "minified": false,\n  "comments": true\n}</code></pre><div class="note">📌 配置文件支持 .babelrc、.babelrc.json、babel.config.js 等多种格式。</div>',
    tags: ['配置', 'babel.config', '.babelrc']
  },
  presets: {
    title: 'Presets 预设',
    body: '<p class="lead">Preset 是 Babel 插件的集合，简化配置，开箱即用。</p><h3>常用预设</h3><ul><li><strong>@babel/preset-env</strong>：根据目标环境自动转换语法</li><li><strong>@babel/preset-react</strong>：支持 JSX 和 React 特性</li><li><strong>@babel/preset-typescript</strong>：支持 TypeScript</li><li><strong>@babel/preset-flow</strong>：支持 Flow 类型</li></ul><pre><code>{\n  "presets": [\n    "@babel/preset-env",\n    "@babel/preset-react",\n    "@babel/preset-typescript"\n  ]\n}</code></pre>',
    tags: ['presets', '预设', '插件集合']
  },
  plugins: {
    title: 'Plugins 插件',
    body: '<p class="lead">插件是 Babel 转换的基本单元，每个插件负责一种语法转换。</p><pre><code># 安装插件\nnpm install --save-dev @babel/plugin-transform-arrow-functions\n\n# 配置文件\n{\n  "plugins": [\n    "@babel/plugin-transform-arrow-functions",\n    ["@babel/plugin-proposal-decorators", { "legacy": true }],\n    "@babel/plugin-transform-runtime"\n  ]\n}\n\n# 插件执行顺序\n# 1. 插件从前往后执行\n# 2. 预设从后往前执行</code></pre>',
    tags: ['plugins', '插件', '转换']
  },
  'babel-env': {
    title: '@babel/preset-env',
    body: '<p class="lead">@babel/preset-env 根据目标环境智能决定需要转换的语法和 polyfill。</p><pre><code>{\n  "presets": [\n    ["@babel/preset-env", {\n      "targets": {\n        "browsers": ["> 1%", "last 2 versions", "not dead"],\n        "node": "14"\n      },\n      "useBuiltIns": "usage",\n      "corejs": 3,\n      "modules": false,\n      "debug": true\n    }]\n  ]\n}</code></pre><div class="note">🎯 推荐使用 browserslist 配置目标环境，与 Autoprefixer 等工具共享配置。</div>',
    tags: ['preset-env', 'browserslist', '兼容性']
  },
  polyfill: {
    title: 'Polyfill 处理',
    body: '<p class="lead">Polyfill 用于模拟新 API，如 Promise、Array.prototype.includes 等。</p><pre><code># 安装 core-js\nnpm install core-js@3\n\n# 方案一：直接引入\nimport "core-js/stable";\n\n# 方案二：preset-env 自动注入\n{\n  "presets": [\n    ["@babel/preset-env", {\n      "useBuiltIns": "usage",\n      "corejs": 3\n    }]\n  ]\n}\n\n# 方案三：使用 transform-runtime（库开发推荐）\nnpm install --save-dev @babel/plugin-transform-runtime\nnpm install --save @babel/runtime-corejs3</code></pre>',
    tags: ['polyfill', 'core-js', 'useBuiltIns']
  },
  'preset-react': {
    title: '@babel/preset-react',
    body: '<p class="lead">支持 React JSX 语法和 React 特定优化。</p><pre><code># 安装\nnpm install --save-dev @babel/preset-react\n\n# 配置\n{\n  "presets": [\n    ["@babel/preset-react", {\n      "runtime": "automatic",\n      "development": true,\n      "importSource": "react"\n    }]\n  ]\n}\n\n# JSX 转换示例\n// 输入\nconst App = () => &lt;div&gt;Hello&lt;/div&gt;;\n// 输出（automatic runtime）\nimport { jsx as _jsx } from "react/jsx-runtime";\nconst App = () =&gt; _jsx("div", { children: "Hello" });</code></pre>',
    tags: ['React', 'JSX', 'preset-react']
  },
  'preset-typescript': {
    title: '@babel/preset-typescript',
    body: '<p class="lead">支持 TypeScript 语法转换（类型擦除）。</p><pre><code># 安装\nnpm install --save-dev @babel/preset-typescript\n\n# 配置\n{\n  "presets": [\n    ["@babel/preset-typescript", {\n      "isTSX": true,\n      "allExtensions": true,\n      "allowNamespaces": true\n    }]\n  ]\n}\n\n# 使用\ntype User = { name: string };\nconst user: User = { name: "Alice" };\n// Babel 会移除类型注解，输出纯 JS</code></pre><div class="note">⚠️ Babel 只做类型擦除，不做类型检查，建议配合 tsc --noEmit 使用。</div>',
    tags: ['TypeScript', '类型擦除', 'preset-typescript']
  },
  'preset-flow': {
    title: '@babel/preset-flow',
    body: '<p class="lead">支持 Flow 类型注解语法转换。</p><pre><code># 安装\nnpm install --save-dev @babel/preset-flow\n\n# 配置\n{\n  "presets": ["@babel/preset-flow"]\n}\n\n# 使用\n// @flow\nfunction add(x: number, y: number): number {\n  return x + y;\n}\n// 转换后移除类型注解</code></pre>',
    tags: ['Flow', '类型', 'preset-flow']
  },
  'babel-webpack': {
    title: 'Webpack 集成',
    body: '<p class="lead">通过 babel-loader 在 Webpack 中使用 Babel。</p><pre><code># 安装\nnpm install --save-dev babel-loader @babel/core @babel/preset-env\n\n# webpack.config.js\nmodule.exports = {\n  module: {\n    rules: [\n      {\n        test: /\\.(js|jsx|ts|tsx)$/,\n        exclude: /node_modules/,\n        use: {\n          loader: "babel-loader",\n          options: {\n            presets: ["@babel/preset-env", "@babel/preset-react"]\n          }\n        }\n      }\n    ]\n  }\n};</code></pre>',
    tags: ['Webpack', 'babel-loader', '集成']
  },
  'babel-vite': {
    title: 'Vite 集成',
    body: '<p class="lead">Vite 默认使用 ESBuild 进行转换，但也支持 Babel 插件。</p><pre><code># 安装\nnpm install --save-dev @vitejs/plugin-react\n\n# vite.config.js\nimport { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [\n    react({\n      babel: {\n        presets: ["@babel/preset-env"],\n        plugins: ["@babel/plugin-transform-runtime"]\n      }\n    })\n  ]\n});</code></pre>',
    tags: ['Vite', '插件', '集成']
  },
  'babel-jest': {
    title: 'Jest 测试',
    body: '<p class="lead">在 Jest 测试中使用 Babel 转换代码。</p><pre><code># 安装\nnpm install --save-dev babel-jest @babel/core\n\n# jest.config.js\nmodule.exports = {\n  transform: {\n    "^.+\\\\.(js|jsx|ts|tsx)$": "babel-jest"\n  },\n  transformIgnorePatterns: [\n    "/node_modules/(?!lodash-es/)"\n  ]\n};\n\n# babel.config.js\nmodule.exports = {\n  presets: [\n    ["@babel/preset-env", { targets: { node: "current" } }],\n    "@babel/preset-typescript"\n  ]\n};</code></pre>',
    tags: ['Jest', '测试', 'babel-jest']
  },
  'babel-node': {
    title: '@babel/node',
    body: '<p class="lead">直接运行 ES6+ 代码的 Node.js REPL 环境。</p><pre><code># 安装\nnpm install --save-dev @babel/node\n\n# 使用\nnpx babel-node index.js\n\n# 支持 REPL\nnpx babel-node\n\n# 传递参数\nnpx babel-node index.js --arg1 value\n\n# 配合 preset-env 使用\nnpx babel-node --presets @babel/preset-env index.js</code></pre><div class="note">⚠️ @babel/node 不适用于生产环境，仅供开发调试使用。</div>',
    tags: ['babel-node', 'REPL', '开发调试']
  },
  'babel-parser': {
    title: 'AST 解析',
    body: '<p class="lead">Babel 将代码解析为 AST（抽象语法树），便于分析和转换。</p><pre><code>const parser = require("@babel/parser");\nconst generate = require("@babel/generator").default;\nconst traverse = require("@babel/traverse").default;\n\n// 解析代码\nconst code = "const a = 1 + 2;";\nconst ast = parser.parse(code);\n\n// 遍历 AST\ntraverse(ast, {\n  Identifier(path) {\n    console.log(path.node.name);\n  }\n});\n\n// 生成代码\nconst output = generate(ast, { compact: true });\nconsole.log(output.code);</code></pre>',
    tags: ['AST', '解析', '@babel/parser']
  },
  'custom-plugin': {
    title: '自定义插件',
    body: '<p class="lead">编写 Babel 插件来扩展转换能力。</p><pre><code>// plugin.js\nmodule.exports = function() {\n  return {\n    visitor: {\n      Identifier(path) {\n        if (path.node.name === "console") {\n          path.node.name = "log";\n        }\n      },\n      CallExpression(path) {\n        if (path.node.callee.name === "log") {\n          console.log("Found log call");\n        }\n      }\n    }\n  };\n};\n\n// 使用插件\n{\n  "plugins": ["./plugin.js"]\n}</code></pre><div class="note">📖 Babel 插件手册：https://github.com/jamiebuilds/babel-handbook</div>',
    tags: ['插件开发', 'visitor', 'AST']
  },
  'babel-macro': {
    title: 'Babel Macros',
    body: '<p class="lead">Macros 提供编译时代码转换，无需手动配置 Babel 插件。</p><pre><code># 安装\nnpm install --save-dev babel-plugin-macros\n\n// 使用 macro\nimport files from "./files.macro";\nconsole.log(files); // 编译时读取目录文件列表\n\n// 配置\n{\n  "plugins": ["babel-plugin-macros"]\n}\n\n// 自定义 macro\nconst { createMacro } = require("babel-plugin-macros");\nmodule.exports = createMacro(({ references, state, babel }) => {\n  // 宏逻辑\n});</code></pre>',
    tags: ['macros', '编译时', 'babel-plugin-macros']
  },
  'babel-helper': {
    title: '辅助函数',
    body: '<p class="lead">Babel 辅助函数用于避免重复注入代码。</p><pre><code># 使用 transform-runtime 减少重复\nnpm install --save-dev @babel/plugin-transform-runtime\nnpm install --save @babel/runtime\n\n{\n  "plugins": [\n    ["@babel/plugin-transform-runtime", {\n      "corejs": 3,\n      "helpers": true,\n      "regenerator": true,\n      "absoluteRuntime": false\n    }]\n  ]\n}\n\n# 辅助函数示例\n// 不使用 runtime - 每个文件都有 _classCallCheck\n// 使用 runtime - 从 @babel/runtime 导入，代码更小</code></pre>',
    tags: ['helpers', 'transform-runtime', '优化']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Babel 官方文档获取更多信息。</p>',
        tags: ['Babel', 'JavaScript']
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

addLink('babel-intro', 'babel-install')
addLink('babel-install', 'babel-cli')
addLink('babel-install', 'babel-config')
addLink('babel-config', 'presets')
addLink('babel-config', 'plugins')
addLink('presets', 'babel-env')
addLink('presets', 'preset-react')
addLink('presets', 'preset-typescript')
addLink('babel-env', 'polyfill')
addLink('plugins', 'custom-plugin')
addLink('babel-webpack', 'babel-install')
addLink('babel-vite', 'babel-install')
addLink('babel-jest', 'babel-install')
addLink('babel-node', 'babel-cli')
addLink('babel-parser', 'custom-plugin')
addLink('babel-macro', 'plugins')
addLink('babel-helper', 'polyfill')

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

onMounted(() => {
    const token = localStorage.getItem('authToken');
    if (!token) userInfo.value = { username: 'CSS设计师', email: 'css@example.com' };
    else try { userInfo.value = JSON.parse(localStorage.getItem('user_info')); } catch(e) {}
    document.addEventListener('click', handleClickOutside);
    timer = setInterval(updateTime, 1000);
    nextTick(() => {
        initChart();
        if (contentAreaRef.value) {
            scrollHandler = updateActiveOnScroll;
            contentAreaRef.value.addEventListener('scroll', scrollHandler);
            updateActiveOnScroll();
        }
        const defaultTarget = document.getElementById('content-selectors_intro');
        if (defaultTarget) defaultTarget.scrollIntoView();
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