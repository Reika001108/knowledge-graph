<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">ESLint 知识库</h1>
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
          <h2>🔍 <span class="gradient-text">ESLint 完全指南</span></h2>
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
          <p>🔍 可插拔的 JavaScript 代码检查工具</p>
          <p>✨ 点击节点双向联动 | 保持代码质量</p>
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
          <h3>🔗 ESLint 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'ESLint用户'
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

// ========== ESLint 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'eslint-intro', label: 'ESLint 简介', hot: true },
      { id: 'eslint-install', label: '安装与配置', hot: true },
      { id: 'eslint-cli', label: '命令行使用', hot: true },
      { id: 'eslint-config', label: '配置文件', hot: true }
    ]},
  { title: '📋 规则与配置', items: [
      { id: 'rules', label: '规则详解', hot: true },
      { id: 'rule-levels', label: '规则级别', hot: true },
      { id: 'extends', label: '共享配置', hot: true },
      { id: 'plugins', label: '插件系统', hot: true }
    ]},
  { title: '🎨 常用配置集', items: [
      { id: 'eslint-recommended', label: 'eslint:recommended', hot: true },
      { id: 'airbnb-config', label: 'Airbnb 规范', hot: true },
      { id: 'standard-config', label: 'Standard 规范', hot: true },
      { id: 'prettier-config', label: 'Prettier 集成', hot: true }
    ]},
  { title: '🛠️ 集成与工具', items: [
      { id: 'eslint-vscode', label: 'VS Code 集成', hot: true },
      { id: 'eslint-webpack', label: 'Webpack 集成', hot: true },
      { id: 'eslint-git', label: 'Git Hooks', hot: true },
      { id: 'eslint-ci', label: 'CI/CD 集成' }
    ]},
  { title: '⚙️ 高级特性', items: [
      { id: 'custom-rule', label: '自定义规则', hot: true },
      { id: 'eslint-parser', label: '自定义解析器' },
      { id: 'eslint-fix', label: '自动修复', hot: true },
      { id: 'eslint-ignore', label: '忽略文件' }
    ]}
])

const selectedId = ref('eslint-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== ESLint 内容映射表 ==========
const contentMap = {
  'eslint-intro': {
    title: 'ESLint 简介',
    body: '<p class="lead">ESLint 是一个可插拔的 JavaScript 代码检查工具，用于识别和报告代码中的模式问题，帮助保持代码风格一致并避免错误。</p><h3>核心特性</h3><ul><li><strong>可插拔</strong>：每条规则都是独立的插件</li><li><strong>可配置</strong>：支持定义规则级别、共享配置</li><li><strong>自动修复</strong>：许多规则支持自动修复问题</li><li><strong>丰富的生态</strong>：支持 React、Vue、TypeScript 等</li></ul><div class="note">💡 ESLint 由 Nicholas C. Zakas 于 2013 年创建，是目前最流行的 JavaScript 代码检查工具。</div>',
    tags: ['代码检查', 'Linter', '质量保证']
  },
  'eslint-install': {
    title: '安装与配置',
    body: '<p class="lead">ESLint 可以通过 npm 安装，并提供交互式初始化工具。</p><pre><code># 安装 ESLint\nnpm install --save-dev eslint\n\n# 初始化配置\nnpx eslint --init\n\n# 交互式问题示例\n? How would you like to use ESLint? To check syntax and find problems\n? What type of modules does your project use? JavaScript modules (import/export)\n? Which framework does your project use? React\n? Does your project use TypeScript? Yes\n? Where does your code run? Browser\n? What format do you want your config file to be in? JavaScript\n\n# 手动安装常用配置\nnpm install --save-dev eslint-plugin-react @typescript-eslint/parser @typescript-eslint/eslint-plugin</code></pre>',
    tags: ['安装', '初始化', '配置']
  },
  'eslint-cli': {
    title: '命令行使用',
    body: '<p class="lead">ESLint 提供了强大的命令行工具，方便在终端中运行检查。</p><pre><code># 检查单个文件\nnpx eslint file.js\n\n# 检查整个目录\nnpx eslint src/ --ext .js,.jsx,.ts,.tsx\n\n# 自动修复问题\nnpx eslint src/ --fix\n\n# 输出格式化结果\nnpx eslint src/ --format json\nnpx eslint src/ --format stylish\nnpx eslint src/ --format codeframe\n\n# 只检查指定规则\nnpx eslint src/ --rule "no-console: error"\n\n# 忽略特定文件\nnpx eslint src/ --ignore-pattern "**/*.test.js"\n\n# 缓存以提高性能\nnpx eslint src/ --cache</code></pre>',
    tags: ['CLI', '命令行', '自动修复']
  },
  'eslint-config': {
    title: '配置文件',
    body: '<p class="lead">ESLint 支持多种配置文件格式，推荐使用 eslint.config.js（扁平配置）。</p><pre><code>// eslint.config.js (新配置系统 - ESLint 9+)\nexport default [\n  {\n    files: ["**/*.js"],\n    languageOptions: {\n      ecmaVersion: "latest",\n      sourceType: "module",\n    },\n    rules: {\n      "no-console": "warn",\n      "eqeqeq": "error"\n    }\n  }\n];\n\n// .eslintrc.json (旧配置系统)\n{\n  "env": {\n    "browser": true,\n    "es2021": true,\n    "node": true\n  },\n  "extends": ["eslint:recommended", "plugin:react/recommended"],\n  "parserOptions": {\n    "ecmaVersion": "latest",\n    "sourceType": "module"\n  },\n  "rules": {\n    "no-unused-vars": "warn",\n    "semi": ["error", "always"]\n  }\n}</code></pre>',
    tags: ['配置', 'eslint.config.js', '.eslintrc']
  },
  rules: {
    title: '规则详解',
    body: '<p class="lead">ESLint 内置了数百条规则，涵盖代码质量和代码风格两大类。</p><h3>常用规则分类</h3><ul><li><strong>可能错误</strong>：no-cond-assign, no-constant-condition, no-duplicate-args</li><li><strong>最佳实践</strong>：eqeqeq, no-eval, no-implied-eval, radix</li><li><strong>变量相关</strong>：no-unused-vars, no-undef, no-shadow</li><li><strong>代码风格</strong>：semi, quotes, indent, comma-dangle, max-len</li><li><strong>ES6+ 特性</strong>：no-var, prefer-const, prefer-arrow-callback</li></ul><pre><code>// 规则配置示例\n{\n  "rules": {\n    "semi": ["error", "never"],\n    "quotes": ["error", "single", { "avoidEscape": true }],\n    "indent": ["error", 2],\n    "comma-dangle": ["error", "always-multiline"]\n  }\n}</code></pre>',
    tags: ['规则', '代码质量', '代码风格']
  },
  'rule-levels': {
    title: '规则级别',
    body: '<p class="lead">每条规则可以配置三个级别，控制检查行为的严格程度。</p><pre><code>// 规则级别配置\n{\n  "rules": {\n    // "off" 或 0 - 关闭规则\n    "no-debugger": "off",\n    \n    // "warn" 或 1 - 警告，不阻止构建\n    "no-console": "warn",\n    \n    // "error" 或 2 - 错误，触发失败\n    "eqeqeq": "error"\n  }\n}\n\n// 带选项的规则配置\n{\n  "rules": {\n    "quotes": ["error", "single", { "avoidEscape": true }],\n    "semi": ["error", "never"],\n    "indent": ["error", 2, { "SwitchCase": 1 }]\n  }\n}</code></pre><div class="note">🎯 建议：使用 "error" 级别确保代码质量，配合 --fix 自动修复。</div>',
    tags: ['规则级别', 'error', 'warn', 'off']
  },
  extends: {
    title: '共享配置',
    body: '<p class="lead">使用 extends 继承已有的配置，避免重复定义规则。</p><pre><code>// 继承 ESLint 内置配置\n{\n  "extends": ["eslint:recommended", "eslint:all"]\n}\n\n// 继承插件提供的配置\n{\n  "extends": [\n    "plugin:react/recommended",\n    "plugin:@typescript-eslint/recommended",\n    "plugin:vue/vue3-recommended"\n  ]\n}\n\n// 继承 npm 包配置\n{\n  "extends": ["airbnb-base", "@mycompany/eslint-config"]\n}\n\n// 配置合并规则\n// 后面的配置会覆盖前面的同名规则\n{\n  "extends": ["eslint:recommended", "airbnb"],\n  "rules": {\n    "no-console": "off"  // 覆盖继承的规则\n  }\n}</code></pre>',
    tags: ['extends', '共享配置', '继承']
  },
  plugins: {
    title: '插件系统',
    body: '<p class="lead">插件为 ESLint 添加额外的规则、环境、配置等扩展功能。</p><pre><code># 安装插件\nnpm install --save-dev eslint-plugin-react eslint-plugin-vue\n\n# 配置插件\n{\n  "plugins": ["react", "vue"],\n  "extends": [\n    "plugin:react/recommended",\n    "plugin:vue/vue3-recommended"\n  ],\n  "rules": {\n    "react/jsx-uses-react": "error",\n    "vue/multi-word-component-names": "warn"\n  }\n}\n\n// 常用插件\n// - eslint-plugin-react (React 规则)\n// - eslint-plugin-vue (Vue 规则)\n// - @typescript-eslint/eslint-plugin (TypeScript 规则)\n// - eslint-plugin-import (导入规则)\n// - eslint-plugin-jest (Jest 测试规则)</code></pre>',
    tags: ['plugins', '插件', '扩展']
  },
  'eslint-recommended': {
    title: 'eslint:recommended',
    body: '<p class="lead">eslint:recommended 是 ESLint 官方推荐的核心规则集，包含常见的最佳实践规则。</p><pre><code>{\n  "extends": ["eslint:recommended"]\n}\n\n// 包含的常用规则\n// - no-constant-condition: 禁止常量条件\n// - no-duplicate-case: 禁止重复 case\n// - no-empty: 禁止空块语句\n// - no-extra-semi: 禁止多余分号\n// - no-unreachable: 禁止不可达代码\n// - no-unused-vars: 禁止未使用变量\n// - use-isnan: 要求使用 isNaN() 检查 NaN\n// - valid-typeof: 要求 typeof 比较有效字符串</code></pre><div class="note">🎯 建议始终启用 eslint:recommended 作为基础配置。</div>',
    tags: ['eslint:recommended', '官方推荐', '基础配置']
  },
  'airbnb-config': {
    title: 'Airbnb 规范',
    body: '<p class="lead">Airbnb 是目前最流行的 JavaScript 代码规范，以其严格和全面著称。</p><pre><code># 安装\nnpx install-peerdeps --dev eslint-config-airbnb\n\n# 配置\n{\n  "extends": ["airbnb"]\n}\n\n# 支持 React 的项目\n{\n  "extends": ["airbnb", "airbnb/hooks"]\n}\n\n# 支持 TypeScript\n{\n  "extends": ["airbnb", "airbnb-typescript"]\n}\n\n// Airbnb 规范特点\n// - 强制使用 === 而不是 ==\n// - 要求箭头函数作为回调\n// - 禁止使用 var，强制 const/let\n// - 严格的导入顺序规则</code></pre>',
    tags: ['Airbnb', '代码规范', '流行配置']
  },
  'standard-config': {
    title: 'Standard 规范',
    body: '<p class="lead">JavaScript Standard Style 是一个零配置的代码规范，强调简洁和自动修复。</p><pre><code># 安装\nnpm install --save-dev eslint-config-standard\n\n# 配置\n{\n  "extends": ["standard"]\n}\n\n// Standard 规范特点\n// - 2 空格缩进\n// - 字符串使用单引号\n// - 无分号（除非必要）\n// - 关键字后加空格\n// - 函数名后不加空格\n// - 始终使用 === 而不是 ==\n\n// 示例代码\nfunction example () {\n  const message = \'Hello Standard\'\n  console.log(message)\n}\n\nmodule.exports = example</code></pre>',
    tags: ['Standard', '零配置', '无分号']
  },
  'prettier-config': {
    title: 'Prettier 集成',
    body: '<p class="lead">Prettier 是一个代码格式化工具，与 ESLint 配合使用可以同时处理代码质量和代码风格。</p><pre><code># 安装依赖\nnpm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier\n\n# .eslintrc.json\n{\n  "extends": [\n    "eslint:recommended",\n    "plugin:prettier/recommended"\n  ],\n  "plugins": ["prettier"],\n  "rules": {\n    "prettier/prettier": "error"\n  }\n}\n\n# .prettierrc\n{\n  "semi": false,\n  "singleQuote": true,\n  "tabWidth": 2,\n  "trailingComma": "es5",\n  "printWidth": 100\n}</code></pre><div class="note">🎯 使用 eslint-config-prettier 关闭 ESLint 中与 Prettier 冲突的格式规则。</div>',
    tags: ['Prettier', '格式化', '冲突解决']
  },
  'eslint-vscode': {
    title: 'VS Code 集成',
    body: '<p class="lead">在 VS Code 中使用 ESLint 插件可以获得实时检查、自动修复和保存时格式化功能。</p><pre><code># 安装 VS Code 插件\n# 搜索 ESLint 并安装（作者：Microsoft）\n\n# .vscode/settings.json\n{\n  "editor.codeActionsOnSave": {\n    "source.fixAll.eslint": true\n  },\n  "eslint.validate": [\n    "javascript",\n    "javascriptreact",\n    "typescript",\n    "typescriptreact",\n    "vue",\n    "html",\n    "markdown"\n  ],\n  "eslint.format.enable": true,\n  "eslint.lintTask.enable": true,\n  "eslint.options": {\n    "extensions": [".js", ".jsx", ".ts", ".tsx"]\n  }\n}</code></pre>',
    tags: ['VS Code', '编辑器集成', '保存时修复']
  },
  'eslint-webpack': {
    title: 'Webpack 集成',
    body: '<p class="lead">通过 eslint-loader 在 Webpack 构建过程中运行 ESLint。</p><pre><code># 安装\nnpm install --save-dev eslint-webpack-plugin\n\n// webpack.config.js\nconst ESLintPlugin = require(\'eslint-webpack-plugin\');\n\nmodule.exports = {\n  plugins: [\n    new ESLintPlugin({\n      extensions: [\'js\', \'jsx\', \'ts\', \'tsx\'],\n      exclude: [\'node_modules\', \'dist\'],\n      fix: true,\n      cache: true,\n      failOnError: true,\n      failOnWarning: false,\n    }),\n  ],\n};\n\n// 开发环境可选\nmodule.exports = {\n  plugins: [\n    process.env.NODE_ENV === \'production\' \n      ? new ESLintPlugin({ failOnError: true })\n      : new ESLintPlugin({ emitWarning: true })\n  ]\n};</code></pre>',
    tags: ['Webpack', 'eslint-webpack-plugin', '构建集成']
  },
  'eslint-git': {
    title: 'Git Hooks',
    body: '<p class="lead">使用 husky 和 lint-staged 在 Git 提交前自动检查和修复代码。</p><pre><code># 安装\nnpm install --save-dev husky lint-staged\n\n# 初始化 husky\nnpx husky install\nnpx husky add .husky/pre-commit "npx lint-staged"\n\n# package.json\n{\n  "lint-staged": {\n    "*.{js,jsx,ts,tsx}": [\n      "eslint --fix",\n      "git add"\n    ],\n    "*.{json,md}": [\n      "prettier --write"\n    ]\n  }\n}\n\n# 或使用 .lintstagedrc.js\nmodule.exports = {\n  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],\n  "*.{json,md}": ["prettier --write"]\n};</code></pre>',
    tags: ['Git Hooks', 'husky', 'lint-staged']
  },
  'eslint-ci': {
    title: 'CI/CD 集成',
    body: '<p class="lead">在 CI/CD 流水线中运行 ESLint，确保代码质量。</p><pre><code># GitHub Actions 示例\nname: Lint\non: [push, pull_request]\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-node@v3\n        with:\n          node-version: \'18\'\n          cache: \'npm\'\n      - run: npm ci\n      - run: npm run lint -- --max-warnings 0\n\n# package.json scripts\n{\n  "scripts": {\n    "lint": "eslint src/ --ext .js,.jsx,.ts,.tsx",\n    "lint:fix": "npm run lint -- --fix",\n    "lint:ci": "npm run lint -- --format junit --output-file eslint.xml"\n  }\n}</code></pre>',
    tags: ['CI/CD', 'GitHub Actions', '质量门禁']
  },
  'custom-rule': {
    title: '自定义规则',
    body: '<p class="lead">开发 ESLint 自定义规则来满足项目特定需求。</p><pre><code>// custom-rule.js\nmodule.exports = {\n  meta: {\n    type: "problem",\n    docs: {\n      description: "禁止使用 console.log",\n      category: "Best Practices",\n      recommended: false\n    },\n    fixable: "code",\n    schema: []\n  },\n  create(context) {\n    return {\n      CallExpression(node) {\n        if (node.callee.type === "MemberExpression" &&\n            node.callee.object.name === "console" &&\n            node.callee.property.name === "log") {\n          context.report({\n            node,\n            message: "禁止使用 console.log",\n            fix(fixer) {\n              return fixer.remove(node);\n            }\n          });\n        }\n      }\n    };\n  }\n};\n\n// 使用自定义规则\n{\n  "rules": {\n    "my-custom-rule/no-console": "error"\n  }\n}</code></pre>',
    tags: ['自定义规则', 'AST', '插件开发']
  },
  'eslint-parser': {
    title: '自定义解析器',
    body: '<p class="lead">使用自定义解析器支持非标准 JavaScript 语法。</p><pre><code># 安装 TypeScript 解析器\nnpm install --save-dev @typescript-eslint/parser\n\n# 配置\n{\n  "parser": "@typescript-eslint/parser",\n  "parserOptions": {\n    "ecmaVersion": "latest",\n    "sourceType": "module",\n    "project": "./tsconfig.json"\n  }\n}\n\n# 常用解析器\n# - @typescript-eslint/parser (TypeScript)\n# - @babel/eslint-parser (Babel)\n# - vue-eslint-parser (Vue)\n\n# 多个解析器配置\n{\n  "overrides": [\n    {\n      "files": ["*.ts", "*.tsx"],\n      "parser": "@typescript-eslint/parser"\n    },\n    {\n      "files": ["*.vue"],\n      "parser": "vue-eslint-parser"\n    }\n  ]\n}</code></pre>',
    tags: ['解析器', 'TypeScript', '自定义语法']
  },
  'eslint-fix': {
    title: '自动修复',
    body: '<p class="lead">ESLint 的许多规则支持自动修复，可以一键解决格式问题。</p><pre><code># 命令行自动修复\nnpx eslint src/ --fix\n\n# 只修复特定规则\nnpx eslint src/ --fix --rule "semi"\n\n# 在代码中禁用自动修复的规则\n// eslint-disable-next-line no-console -- 这条规则不支持自动修复\nconsole.log("debug");\n\n# VS Code 保存时自动修复\n{\n  "editor.codeActionsOnSave": {\n    "source.fixAll.eslint": true\n  }\n}\n\n# 支持自动修复的规则示例\n// 规则列表\n// - semi (分号)\n// - quotes (引号)\n// - indent (缩进)\n// - comma-dangle (尾逗号)\n// - no-extra-semi (多余分号)\n// - no-trailing-spaces (尾随空格)</code></pre>',
    tags: ['自动修复', '--fix', '保存时修复']
  },
  'eslint-ignore': {
    title: '忽略文件',
    body: '<p class="lead">使用 .eslintignore 文件忽略不需要检查的文件。</p><pre><code># .eslintignore\nnode_modules/\ndist/\nbuild/\ncoverage/\n*.min.js\n*.config.js\n!.*.config.js  # 排除特定文件\n\n# 在配置文件中忽略\n{\n  "ignorePatterns": [\n    "node_modules/",\n    "dist/",\n    "**/*.test.js"\n  ]\n}\n\n# 命令行忽略\nnpx eslint src/ --ignore-path .gitignore\nnpx eslint src/ --ignore-pattern "**/*.spec.js"\n\n# 内联禁用\n// eslint-disable-next-line\nconsole.log("忽略此行");\n\n/* eslint-disable */\nconsole.log("整个文件禁用检查");\n/* eslint-enable */</code></pre>',
    tags: ['.eslintignore', '忽略', '内联禁用']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 ESLint 官方文档获取更多信息。</p>',
        tags: ['ESLint', '代码检查']
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

addLink('eslint-intro', 'eslint-install')
addLink('eslint-install', 'eslint-cli')
addLink('eslint-install', 'eslint-config')
addLink('eslint-config', 'rules')
addLink('rules', 'rule-levels')
addLink('rules', 'extends')
addLink('rules', 'plugins')
addLink('extends', 'eslint-recommended')
addLink('extends', 'airbnb-config')
addLink('extends', 'standard-config')
addLink('extends', 'prettier-config')
addLink('plugins', 'custom-rule')
addLink('plugins', 'eslint-parser')
addLink('eslint-vscode', 'eslint-fix')
addLink('eslint-webpack', 'eslint-cli')
addLink('eslint-git', 'eslint-fix')
addLink('eslint-ci', 'eslint-cli')
addLink('eslint-fix', 'eslint-ignore')

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