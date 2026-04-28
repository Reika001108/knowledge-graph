<template>
  <div class="app-container" :class="{ dark: isDark }">
    <!-- 顶栏（原紫色配色） -->
    <header class="header">
      <div class="logo-section">
        <img src="../img/logo-w.png" alt="Logo" class="logo-img" />
        <h1 class="app-title">Webpack 知识库</h1>
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
          <h2>📦 <span class="gradient-text">Webpack 完全指南</span></h2>
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
          <p>📦 静态模块打包工具 | 前端工程化基石</p>
          <p>✨ 点击节点双向联动 | 从零到一掌握</p>
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
          <h3>🔗 Webpack 知识图谱 <span class="graph-badge">ECharts</span></h3>
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
  return userInfo.value.username || userInfo.value.email?.split('@')[0] || 'Webpack用户'
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

// ========== Webpack 导航数据 ==========
const navSections = ref([
  { title: '🚀 快速入门', items: [
      { id: 'webpack-intro', label: 'Webpack 简介', hot: true },
      { id: 'webpack-install', label: '安装与配置', hot: true },
      { id: 'webpack-core', label: '核心概念', hot: true }
    ]},
  { title: '⚙️ 核心配置', items: [
      { id: 'webpack-entry', label: '入口 Entry', hot: true },
      { id: 'webpack-output', label: '出口 Output', hot: true },
      { id: 'webpack-loaders', label: 'Loader', hot: true },
      { id: 'webpack-plugins', label: 'Plugin', hot: true },
      { id: 'webpack-mode', label: '模式 Mode', hot: true }
    ]},
  { title: '🔧 常用 Loader', items: [
      { id: 'webpack-style-loaders', label: '样式 Loader', hot: true },
      { id: 'webpack-file-loaders', label: '文件 Loader', hot: true },
      { id: 'webpack-js-loaders', label: 'JS Loader', hot: true },
      { id: 'webpack-image-loaders', label: '图片 Loader', hot: true }
    ]},
  { title: '🔌 常用 Plugin', items: [
      { id: 'webpack-html-plugin', label: 'HtmlWebpackPlugin', hot: true },
      { id: 'webpack-css-plugin', label: 'MiniCssExtractPlugin', hot: true },
      { id: 'webpack-clean-plugin', label: 'CleanWebpackPlugin', hot: true },
      { id: 'webpack-bundle-analyzer', label: 'BundleAnalyzerPlugin', hot: true }
    ]},
  { title: '⚡ 开发服务器', items: [
      { id: 'webpack-dev-server', label: 'DevServer', hot: true },
      { id: 'webpack-hmr', label: '热模块替换', hot: true },
      { id: 'webpack-proxy', label: '代理配置', hot: true }
    ]},
  { title: '📦 构建优化', items: [
      { id: 'webpack-code-split', label: '代码分割', hot: true },
      { id: 'webpack-tree-shaking', label: 'Tree Shaking', hot: true },
      { id: 'webpack-cache', label: '缓存优化', hot: true },
      { id: 'webpack-minify', label: '代码压缩', hot: true }
    ]}
])

const selectedId = ref('webpack-intro')

const allFlatItems = computed(() => {
  const flat = []
  navSections.value.forEach(section => {
    section.items.forEach(item => flat.push(item))
  })
  return flat
})

// ========== Webpack 内容映射表 ==========
const contentMap = {
  'webpack-intro': {
    title: 'Webpack 简介',
    body: '<p class="lead">Webpack 是一个静态模块打包工具，将项目中的各种资源（JS、CSS、图片等）打包成一个或多个 bundle。</p><h3>核心特点</h3><ul><li><strong>模块化</strong>：支持各种模块规范</li><li><strong>Loader</strong>：转换非 JS 资源</li><li><strong>Plugin</strong>：扩展打包功能</li><li><strong>代码分割</strong>：按需加载，优化性能</li><li><strong>开发服务器</strong>：热更新，提升开发效率</li></ul><div class="note">💡 Webpack 由 Tobias Koppers 创建，是前端工程化的基石。</div>',
    tags: ['打包工具', '模块化', '构建']
  },
  'webpack-install': {
    title: '安装与配置',
    body: '<p class="lead">Webpack 可以通过 npm 安装。</p><pre><code># 安装 webpack 和 CLI\nnpm install webpack webpack-cli --save-dev\n\n# 创建配置文件\nnpx webpack init\n\n# 基本配置文件\n// webpack.config.js\nconst path = require("path")\n\nmodule.exports = {\n  entry: "./src/index.js",\n  output: {\n    filename: "bundle.js",\n    path: path.resolve(__dirname, "dist")\n  },\n  mode: "development"\n}\n\n# 运行构建\nnpx webpack\n\n# 监听模式\nnpx webpack --watch</code></pre>',
    tags: ['安装', '配置', 'webpack-cli']
  },
  'webpack-core': {
    title: '核心概念',
    body: '<p class="lead">Webpack 的五大核心概念。</p><pre><code>// 1. Entry - 入口起点\nentry: "./src/index.js"\n\n// 多入口\nentry: {\n  main: "./src/main.js",\n  admin: "./src/admin.js"\n}\n\n// 2. Output - 输出结果\noutput: {\n  filename: "[name].bundle.js",\n  path: path.resolve(__dirname, "dist"),\n  clean: true\n}\n\n// 3. Loader - 模块转换器\nmodule: {\n  rules: [\n    { test: /\\.css$/, use: ["style-loader", "css-loader"] }\n  ]\n}\n\n// 4. Plugin - 插件扩展\nplugins: [\n  new HtmlWebpackPlugin({ template: "./src/index.html" })\n]\n\n// 5. Mode - 模式\nmode: "development" // 或 "production"</code></pre>',
    tags: ['Entry', 'Output', 'Loader']
  },
  'webpack-entry': {
    title: '入口 Entry',
    body: '<p class="lead">入口指示 Webpack 从哪个文件开始构建依赖图。</p><pre><code>// 单入口（SPA）\nmodule.exports = {\n  entry: "./src/index.js"\n}\n\n// 对象语法（多入口）\nmodule.exports = {\n  entry: {\n    app: "./src/app.js",\n    admin: "./src/admin.js"\n  }\n}\n\n// 数组语法（多个依赖）\nmodule.exports = {\n  entry: ["./src/polyfill.js", "./src/index.js"]\n}\n\n// 动态入口\nmodule.exports = {\n  entry: () => {\n    return {\n      main: "./src/main.js",\n      vendor: "./src/vendor.js"\n    }\n  }\n}</code></pre>',
    tags: ['Entry', '入口', '依赖图']
  },
  'webpack-output': {
    title: '出口 Output',
    body: '<p class="lead">Output 指定打包后的文件输出位置和命名。</p><pre><code>const path = require("path")\n\nmodule.exports = {\n  output: {\n    // 输出文件名\n    filename: "bundle.js",\n    \n    // 多入口文件名\n    filename: "[name].[contenthash].js",\n    \n    // 输出路径\n    path: path.resolve(__dirname, "dist"),\n    \n    // 清理输出目录\n    clean: true,\n    \n    // 公共路径\n    publicPath: "/assets/",\n    \n    // 异步 chunk 文件名\n    chunkFilename: "[id].[chunkhash].js",\n    \n    // 库输出配置\n    library: {\n      name: "MyLibrary",\n      type: "umd"\n    }\n  }\n}</code></pre>',
    tags: ['Output', '输出', '路径']
  },
  'webpack-loaders': {
    title: 'Loader',
    body: '<p class="lead">Loader 用于将非 JS 文件转换为 Webpack 能处理的有效模块。</p><pre><code>module.exports = {\n  module: {\n    rules: [\n      // CSS Loader\n      {\n        test: /\\.css$/,\n        use: ["style-loader", "css-loader"]\n      },\n      // SCSS Loader\n      {\n        test: /\\.scss$/,\n        use: ["style-loader", "css-loader", "sass-loader"]\n      },\n      // Babel Loader\n      {\n        test: /\\.js$/,\n        exclude: /node_modules/,\n        use: {\n          loader: "babel-loader",\n          options: {\n            presets: ["@babel/preset-env"]\n          }\n        }\n      },\n      // 图片 Loader\n      {\n        test: /\\.(png|jpg|gif)$/,\n        type: "asset/resource"\n      }\n    ]\n  }\n}</code></pre>',
    tags: ['Loader', '转换', 'module']
  },
  'webpack-plugins': {
    title: 'Plugin',
    body: '<p class="lead">Plugin 用于执行更广泛的任务，如打包优化、资源管理、环境变量注入等。</p><pre><code>const HtmlWebpackPlugin = require("html-webpack-plugin")\nconst MiniCssExtractPlugin = require("mini-css-extract-plugin")\nconst { CleanWebpackPlugin } = require("clean-webpack-plugin")\n\nmodule.exports = {\n  plugins: [\n    new CleanWebpackPlugin(),\n    new HtmlWebpackPlugin({\n      template: "./src/index.html",\n      title: "My App"\n    }),\n    new MiniCssExtractPlugin({\n      filename: "[name].[contenthash].css"\n    }),\n    new webpack.DefinePlugin({\n      "process.env.NODE_ENV": JSON.stringify("production")\n    })\n  ]\n}</code></pre>',
    tags: ['Plugin', '插件', '扩展']
  },
  'webpack-mode': {
    title: '模式 Mode',
    body: '<p class="lead">Mode 指定 Webpack 使用相应内置优化。</p><pre><code>// 开发模式\nmodule.exports = {\n  mode: "development",\n  devtool: "eval-source-map"\n}\n\n// 生产模式\nmodule.exports = {\n  mode: "production",\n  optimization: {\n    minimize: true\n  }\n}\n\n// 无模式\nmodule.exports = {\n  mode: "none"\n}\n\n// 环境变量设置\nwebpack --mode=development\n\n// 根据不同环境导出配置\nmodule.exports = (env, argv) => {\n  const isProduction = argv.mode === "production"\n  return {\n    mode: isProduction ? "production" : "development",\n    devtool: isProduction ? false : "eval-source-map"\n  }\n}</code></pre>',
    tags: ['Mode', '环境', '优化']
  },
  'webpack-style-loaders': {
    title: '样式 Loader',
    body: '<p class="lead">处理 CSS、SCSS、LESS 等样式文件。</p><pre><code>// CSS Loader\n{\n  test: /\\.css$/,\n  use: ["style-loader", "css-loader"]\n}\n\n// CSS Modules\n{\n  test: /\\.module\\.css$/,\n  use: [\n    "style-loader",\n    {\n      loader: "css-loader",\n      options: {\n        modules: {\n          localIdentName: "[name]__[local]--[hash:base64:5]"\n        }\n      }\n    }\n  ]\n}\n\n// SCSS\n{\n  test: /\\.scss$/,\n  use: ["style-loader", "css-loader", "sass-loader"]\n}\n\n// PostCSS\n{\n  test: /\\.css$/,\n  use: [\n    "style-loader",\n    "css-loader",\n    {\n      loader: "postcss-loader",\n      options: {\n        postcssOptions: {\n          plugins: [require("autoprefixer")]\n        }\n      }\n    }\n  ]\n}</code></pre>',
    tags: ['CSS', 'SCSS', '样式']
  },
  'webpack-file-loaders': {
    title: '文件 Loader',
    body: '<p class="lead">处理字体、文件等资源。</p><pre><code>// file-loader\n{\n  test: /\\.(woff|woff2|eot|ttf|otf)$/,\n  type: "asset/resource"\n}\n\n// url-loader（小文件转 base64）\n{\n  test: /\\.(png|jpg|gif)$/,\n  type: "asset",\n  parser: {\n    dataUrlCondition: {\n      maxSize: 8 * 1024  // 8kb\n    }\n  }\n}\n\n// CSV/XML\n{\n  test: /\\.(csv|tsv)$/,\n  use: ["csv-loader"]\n}\n{\n  test: /\\.xml$/,\n  use: ["xml-loader"]\n}</code></pre>',
    tags: ['文件', '字体', '资源']
  },
  'webpack-js-loaders': {
    title: 'JS Loader',
    body: '<p class="lead">处理 JavaScript 和 TypeScript 文件。</p><pre><code>// Babel Loader\n{\n  test: /\\.js$/,\n  exclude: /node_modules/,\n  use: {\n    loader: "babel-loader",\n    options: {\n      presets: ["@babel/preset-env"]\n    }\n  }\n}\n\n// TypeScript\n{\n  test: /\\.tsx?$/,\n  use: "ts-loader",\n  exclude: /node_modules/\n}\n\n// ESLint\n{\n  test: /\\.js$/,\n  enforce: "pre",\n  use: ["eslint-loader"],\n  exclude: /node_modules/\n}\n\n// 多 Loader 组合\n{\n  test: /\\.js$/,\n  use: [\n    "cache-loader",\n    "thread-loader",\n    "babel-loader"\n  ]\n}</code></pre>',
    tags: ['Babel', 'TypeScript', 'JS']
  },
  'webpack-image-loaders': {
    title: '图片 Loader',
    body: '<p class="lead">处理图片资源，支持压缩和优化。</p><pre><code>// 基础图片处理\n{\n  test: /\\.(png|jpg|jpeg|gif)$/,\n  type: "asset/resource"\n}\n\n// 图片压缩\n{\n  test: /\\.(png|jpg|jpeg|gif)$/,\n  use: [\n    {\n      loader: "image-webpack-loader",\n      options: {\n        mozjpeg: { progressive: true, quality: 65 },\n        optipng: { enabled: true },\n        pngquant: { quality: [0.65, 0.9], speed: 4 },\n        gifsicle: { interlaced: false }\n      }\n    }\n  ],\n  type: "asset/resource"\n}\n\n// SVG 处理\n{\n  test: /\\.svg$/,\n  use: ["@svgr/webpack"]\n}</code></pre>',
    tags: ['图片', 'SVG', '压缩']
  },
  'webpack-html-plugin': {
    title: 'HtmlWebpackPlugin',
    body: '<p class="lead">HtmlWebpackPlugin 生成 HTML 文件并自动注入打包后的资源。</p><pre><code>const HtmlWebpackPlugin = require("html-webpack-plugin")\n\nmodule.exports = {\n  plugins: [\n    new HtmlWebpackPlugin({\n      title: "My App",\n      template: "./src/index.html",\n      filename: "index.html",\n      inject: "body",\n      favicon: "./src/favicon.ico",\n      meta: {\n        viewport: "width=device-width, initial-scale=1.0"\n      },\n      minify: {\n        removeComments: true,\n        collapseWhitespace: true,\n        removeAttributeQuotes: true\n      },\n      chunks: ["main", "vendor"]\n    }),\n    // 多页面\n    new HtmlWebpackPlugin({\n      template: "./src/admin.html",\n      filename: "admin.html",\n      chunks: ["admin"]\n    })\n  ]\n}</code></pre>',
    tags: ['HtmlWebpackPlugin', 'HTML', '模板']
  },
  'webpack-css-plugin': {
    title: 'MiniCssExtractPlugin',
    body: '<p class="lead">MiniCssExtractPlugin 将 CSS 提取为独立文件。</p><pre><code>const MiniCssExtractPlugin = require("mini-css-extract-plugin")\n\nmodule.exports = {\n  module: {\n    rules: [\n      {\n        test: /\\.css$/,\n        use: [\n          MiniCssExtractPlugin.loader,\n          "css-loader",\n          "postcss-loader"\n        ]\n      }\n    ]\n  },\n  plugins: [\n    new MiniCssExtractPlugin({\n      filename: "[name].[contenthash].css",\n      chunkFilename: "[id].[contenthash].css",\n      ignoreOrder: false\n    })\n  ]\n}</code></pre>',
    tags: ['MiniCssExtractPlugin', 'CSS提取', '优化']
  },
  'webpack-clean-plugin': {
    title: 'CleanWebpackPlugin',
    body: '<p class="lead">CleanWebpackPlugin 在每次构建前清理输出目录。</p><pre><code>const { CleanWebpackPlugin } = require("clean-webpack-plugin")\n\nmodule.exports = {\n  plugins: [\n    new CleanWebpackPlugin({\n      cleanOnceBeforeBuildPatterns: ["**/*", "!important-file.js"],\n      cleanAfterEveryBuildPatterns: ["temp.js"],\n      verbose: true,\n      dry: false\n    })\n  ]\n}\n\n// Webpack 5 内置\nmodule.exports = {\n  output: {\n    clean: true\n  }\n}</code></pre>',
    tags: ['CleanWebpackPlugin', '清理', '输出']
  },
  'webpack-bundle-analyzer': {
    title: 'BundleAnalyzerPlugin',
    body: '<p class="lead">BundleAnalyzerPlugin 可视化分析打包结果。</p><pre><code>const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin\n\nmodule.exports = {\n  plugins: [\n    new BundleAnalyzerPlugin({\n      analyzerMode: "static",\n      reportFilename: "report.html",\n      openAnalyzer: true,\n      generateStatsFile: true,\n      statsFilename: "stats.json",\n      logLevel: "info",\n      defaultSizes: "gzip"\n    })\n  ]\n}\n\n// 只在分析时启用\nmodule.exports = {\n  plugins: [\n    process.env.ANALYZE && new BundleAnalyzerPlugin()\n  ].filter(Boolean)\n}</code></pre>',
    tags: ['BundleAnalyzerPlugin', '分析', '可视化']
  },
  'webpack-dev-server': {
    title: 'DevServer',
    body: '<p class="lead">DevServer 提供开发服务器，支持热更新。</p><pre><code>npm install webpack-dev-server --save-dev\n\n// webpack.config.js\nmodule.exports = {\n  devServer: {\n    static: {\n      directory: path.join(__dirname, "dist")\n    },\n    compress: true,\n    port: 9000,\n    hot: true,\n    open: true,\n    historyApiFallback: true,\n    client: {\n      overlay: {\n        errors: true,\n        warnings: false\n      },\n      progress: true\n    }\n  }\n}\n\n// package.json\n{\n  "scripts": {\n    "start": "webpack serve --open"\n  }\n}</code></pre>',
    tags: ['DevServer', '开发服务器', '热更新']
  },
  'webpack-hmr': {
    title: '热模块替换',
    body: '<p class="lead">HMR 在应用运行时替换、添加或删除模块，无需刷新页面。</p><pre><code>// webpack.config.js\nmodule.exports = {\n  devServer: {\n    hot: true\n  }\n}\n\n// 接受 HMR 更新\nif (module.hot) {\n  module.hot.accept("./module.js", () => {\n    console.log("模块已更新")\n  })\n  \n  module.hot.accept(["./dep1.js", "./dep2.js"], () => {\n    console.log("依赖已更新")\n  })\n  \n  module.hot.dispose(() => {\n    console.log("模块即将被替换")\n    // 清理副作用\n  })\n}</code></pre>',
    tags: ['HMR', '热更新', '热模块替换']
  },
  'webpack-proxy': {
    title: '代理配置',
    body: '<p class="lead">配置代理解决开发环境跨域问题。</p><pre><code>module.exports = {\n  devServer: {\n    proxy: {\n      "/api": {\n        target: "http://localhost:8080",\n        pathRewrite: { "^/api": "" },\n        changeOrigin: true,\n        secure: false,\n        logLevel: "debug"\n      },\n      "/user-api": {\n        target: "http://localhost:8081",\n        changeOrigin: true\n      },\n      "/ws": {\n        target: "ws://localhost:3000",\n        ws: true\n      }\n    }\n  }\n}</code></pre>',
    tags: ['代理', '跨域', 'proxy']
  },
  'webpack-code-split': {
    title: '代码分割',
    body: '<p class="lead">代码分割将代码拆分成多个 chunk，实现按需加载。</p><pre><code>// 入口分割\nentry: {\n  main: "./src/index.js",\n  vendor: "./src/vendor.js"\n},\n\n// 动态导入\nimport("./module").then(module => {\n  module.default()\n})\n\n// SplitChunksPlugin\nmodule.exports = {\n  optimization: {\n    splitChunks: {\n      chunks: "all",\n      cacheGroups: {\n        vendor: {\n          test: /[\\\\/]node_modules[\\\\/]/,\n          name: "vendors",\n          priority: 10\n        },\n        commons: {\n          name: "commons",\n          minChunks: 2,\n          priority: 5\n        }\n      }\n    }\n  }\n}</code></pre>',
    tags: ['代码分割', 'SplitChunks', '按需加载']
  },
  'webpack-tree-shaking': {
    title: 'Tree Shaking',
    body: '<p class="lead">Tree Shaking 移除未使用的代码。</p><pre><code>// 使用 ES Module\nimport { debounce } from "lodash-es"\n\n// package.json\n{\n  "sideEffects": false\n}\n\n// 或指定有副作用的文件\n{\n  "sideEffects": ["*.css", "*.scss"]\n}\n\n// webpack.config.js\nmodule.exports = {\n  mode: "production",\n  optimization: {\n    usedExports: true,\n    minimize: true\n  }\n}</code></pre>',
    tags: ['Tree Shaking', '优化', 'sideEffects']
  },
  'webpack-cache': {
    title: '缓存优化',
    body: '<p class="lead">使用缓存提升构建性能。</p><pre><code>// 文件缓存\nmodule.exports = {\n  cache: {\n    type: "filesystem",\n    buildDependencies: {\n      config: [__filename]\n    }\n  }\n}\n\n// Loader 缓存\n{\n  test: /\\.js$/,\n  use: [\n    "cache-loader",\n    "babel-loader"\n  ]\n}\n\n// 持久化缓存\nmodule.exports = {\n  cache: {\n    type: "filesystem",\n    cacheDirectory: path.resolve(__dirname, ".webpack_cache")\n  }\n}</code></pre>',
    tags: ['缓存', '性能', 'filesystem']
  },
  'webpack-minify': {
    title: '代码压缩',
    body: '<p class="lead">压缩代码减少文件体积。</p><pre><code>// TerserPlugin（JS 压缩）\nconst TerserPlugin = require("terser-webpack-plugin")\n\nmodule.exports = {\n  optimization: {\n    minimize: true,\n    minimizer: [\n      new TerserPlugin({\n        parallel: true,\n        terserOptions: {\n          compress: {\n            drop_console: true,\n            drop_debugger: true\n          }\n        }\n      })\n    ]\n  }\n}\n\n// CSS 压缩\nconst CssMinimizerPlugin = require("css-minimizer-webpack-plugin")\n\nmodule.exports = {\n  optimization: {\n    minimizer: [\n      new CssMinimizerPlugin()\n    ]\n  }\n}</code></pre>',
    tags: ['压缩', 'Terser', '优化']
  }
}

// 确保所有导航项都有默认内容
navSections.value.forEach(section => {
  section.items.forEach(item => {
    if (!contentMap[item.id]) {
      contentMap[item.id] = {
        title: item.label,
        body: '<p>📖 关于 ' + item.label + ' 的详细文档。参考 Webpack 官方文档获取更多信息。</p>',
        tags: ['Webpack', '构建工具']
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

addLink('webpack-intro', 'webpack-install')
addLink('webpack-install', 'webpack-core')
addLink('webpack-entry', 'webpack-output')
addLink('webpack-output', 'webpack-loaders')
addLink('webpack-loaders', 'webpack-plugins')
addLink('webpack-plugins', 'webpack-mode')
addLink('webpack-style-loaders', 'webpack-file-loaders')
addLink('webpack-file-loaders', 'webpack-js-loaders')
addLink('webpack-js-loaders', 'webpack-image-loaders')
addLink('webpack-html-plugin', 'webpack-css-plugin')
addLink('webpack-css-plugin', 'webpack-clean-plugin')
addLink('webpack-clean-plugin', 'webpack-bundle-analyzer')
addLink('webpack-dev-server', 'webpack-hmr')
addLink('webpack-hmr', 'webpack-proxy')
addLink('webpack-code-split', 'webpack-tree-shaking')
addLink('webpack-tree-shaking', 'webpack-cache')
addLink('webpack-cache', 'webpack-minify')

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